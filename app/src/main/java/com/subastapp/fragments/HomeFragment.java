package com.subastapp.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.subastapp.R;
import com.subastapp.adapters.AuctionAdapter;
import com.subastapp.api.ApiClient;
import com.subastapp.api.ApiService;
import com.subastapp.model.Auction;
import com.subastapp.model.AuctionPage;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/** Pantalla principal — resumen de subastas activas + próximas (Doc Home). */
public class HomeFragment extends Fragment {

    private RecyclerView rvActivas;
    private RecyclerView rvProximas;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        rvActivas = view.findViewById(R.id.rv_activas);
        rvProximas = view.findViewById(R.id.rv_proximas);
        rvActivas.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        rvProximas.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));

        view.findViewById(R.id.btn_ver_todas).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_home_to_auctions));
        view.findViewById(R.id.btn_descubrir).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_home_to_discover));

        loadAuctions("ABIERTA", rvActivas);
        loadAuctions("PROGRAMADA", rvProximas);
    }

    private void loadAuctions(String estado, RecyclerView target) {
        ApiService api = ApiClient.create(ApiService.class);
        api.getAuctions(estado, 0, 10).enqueue(new Callback<AuctionPage>() {
            @Override
            public void onResponse(@NonNull Call<AuctionPage> call, @NonNull Response<AuctionPage> response) {
                List<Auction> items = response.isSuccessful() && response.body() != null
                        ? response.body().getContent()
                        : new ArrayList<>();
                target.setAdapter(new AuctionAdapter(requireContext(), items, auction ->
                        Navigation.findNavController(requireView()).navigate(R.id.action_home_to_detail,
                                buildAuctionDetailArgs(auction.getId()))));
            }

            @Override
            public void onFailure(@NonNull Call<AuctionPage> call, @NonNull Throwable t) {
                if (isAdded()) Toast.makeText(getContext(), R.string.error_conexion, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private Bundle buildAuctionDetailArgs(String auctionId) {
        Bundle b = new Bundle();
        b.putString("auctionId", auctionId);
        return b;
    }
}
