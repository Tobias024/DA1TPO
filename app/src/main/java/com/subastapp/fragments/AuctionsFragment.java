package com.subastapp.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.*;
import android.widget.Toast;
import androidx.annotation.*;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.*;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.subastapp.R;
import com.subastapp.activities.LiveBiddingActivity;
import com.subastapp.api.*;
import com.subastapp.model.*;
import com.subastapp.adapters.AuctionAdapter;
import retrofit2.*;
import java.util.*;

public class AuctionsFragment extends Fragment {

    private RecyclerView recyclerView;
    private SwipeRefreshLayout swipeRefresh;
    private AuctionAdapter adapter;
    private ApiService apiService;
    private String currentFilter = "ABIERTA";

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_auctions, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedState) {
        super.onViewCreated(view, savedState);
        apiService = ApiClient.create(ApiService.class);

        recyclerView = view.findViewById(R.id.rv_auctions);
        swipeRefresh = view.findViewById(R.id.swipe_refresh);

        adapter = new AuctionAdapter(requireContext(), new ArrayList<>(), auction -> {
            if (auction.getEstado().equals("EN_CURSO") || auction.getEstado().equals("ABIERTA")) {
                // Join → open live bidding
                apiService.joinAuction(auction.getId()).enqueue(new Callback<Map<String, Object>>() {
                    @Override
                    public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {
                        Intent intent = new Intent(requireActivity(), LiveBiddingActivity.class);
                        intent.putExtra(LiveBiddingActivity.EXTRA_AUCTION_ID, auction.getId());
                        startActivity(intent);
                    }
                    @Override
                    public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                        Toast.makeText(requireContext(), "Error al conectarse", Toast.LENGTH_SHORT).show();
                    }
                });
            }
        });

        recyclerView.setAdapter(adapter);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        swipeRefresh.setColorSchemeResources(R.color.gold);

        // Filter chips
        view.findViewById(R.id.chip_active).setOnClickListener(v -> { currentFilter = "ABIERTA"; loadAuctions(); });
        view.findViewById(R.id.chip_upcoming).setOnClickListener(v -> { currentFilter = "PROXIMA"; loadAuctions(); });
        view.findViewById(R.id.chip_closed).setOnClickListener(v -> { currentFilter = "CERRADA"; loadAuctions(); });

        swipeRefresh.setOnRefreshListener(this::loadAuctions);
        loadAuctions();
    }

    private void loadAuctions() {
        if (swipeRefresh != null) swipeRefresh.setRefreshing(true);
        apiService.getAuctions(currentFilter, 0, 30).enqueue(new Callback<AuctionPage>() {
            @Override
            public void onResponse(@NonNull Call<AuctionPage> call, @NonNull Response<AuctionPage> response) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    List<Auction> list = response.body().getContent();
                    adapter.updateList(list != null ? list : new ArrayList<>());
                }
            }
            @Override
            public void onFailure(@NonNull Call<AuctionPage> call, @NonNull Throwable t) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (isAdded()) Toast.makeText(requireContext(), getString(R.string.error_conexion), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
