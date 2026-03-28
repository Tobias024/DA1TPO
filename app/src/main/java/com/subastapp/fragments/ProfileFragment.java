package com.subastapp.fragments;

import android.os.Bundle;
import android.view.*;
import android.widget.*;
import androidx.annotation.*;
import androidx.fragment.app.Fragment;
import com.subastapp.R;
import com.subastapp.activities.MainActivity;
import com.subastapp.api.*;
import com.subastapp.model.*;
import com.subastapp.utils.SessionManager;
import retrofit2.*;

public class ProfileFragment extends Fragment {

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedState) {
        super.onViewCreated(view, savedState);
        SessionManager session = new SessionManager(requireContext());
        ApiService api = ApiClient.create(ApiService.class);

        // Show user name
        ((TextView) view.findViewById(R.id.tv_user_name))
                .setText(session.getUserName());
        ((TextView) view.findViewById(R.id.tv_user_email))
                .setText(session.getUserEmail());
        ((TextView) view.findViewById(R.id.tv_user_category))
                .setText("★ " + session.getUserCategory());

        // Load metrics
        api.getMyMetrics().enqueue(new Callback<UserMetrics>() {
            @Override
            public void onResponse(@NonNull Call<UserMetrics> c, @NonNull Response<UserMetrics> r) {
                if (r.isSuccessful() && r.body() != null && isAdded()) {
                    UserMetrics m = r.body();
                    ((TextView) view.findViewById(R.id.tv_auctions_won))
                            .setText(String.valueOf(m.getTotalSubastasGanadas()));
                    ((TextView) view.findViewById(R.id.tv_total_paid))
                            .setText(String.format("$%.2f", m.getImporteTotalPagado()));
                }
            }
            @Override public void onFailure(@NonNull Call<UserMetrics> c, @NonNull Throwable t) {}
        });

        view.findViewById(R.id.btn_logout).setOnClickListener(v -> {
            session.clearSession();
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).onLogout();
            }
        });

        view.findViewById(R.id.btn_notifications).setOnClickListener(v ->
                androidx.navigation.Navigation.findNavController(view)
                        .navigate(R.id.action_profile_to_notifications));
    }
}
