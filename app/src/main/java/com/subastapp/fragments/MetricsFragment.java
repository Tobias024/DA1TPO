package com.subastapp.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.subastapp.R;
import com.subastapp.api.ApiClient;
import com.subastapp.api.ApiService;
import com.subastapp.model.UserMetrics;

import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/** Pantalla Métricas — estadísticas del usuario (Doc). */
public class MetricsFragment extends Fragment {

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_metrics, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        loadMetrics(view);
    }

    private void loadMetrics(View root) {
        ApiClient.create(ApiService.class).getMyMetrics().enqueue(new Callback<UserMetrics>() {
            @Override
            public void onResponse(@NonNull Call<UserMetrics> call, @NonNull Response<UserMetrics> response) {
                if (!isAdded() || response.body() == null) return;
                UserMetrics m = response.body();
                ((TextView) root.findViewById(R.id.tv_total_gastado)).setText(formatMoney(m.getTotalGastado()));
                ((TextView) root.findViewById(R.id.tv_participadas)).setText(String.valueOf(m.getSubastasParticipadas()));
                ((TextView) root.findViewById(R.id.tv_ganadas)).setText(String.valueOf(m.getSubastasGanadas()));
                ((TextView) root.findViewById(R.id.tv_tasa_exito)).setText(String.format(Locale.getDefault(), "%.0f%%", m.getTasaExito() * 100));
                ((TextView) root.findViewById(R.id.tv_mayor_puja)).setText(formatMoney(m.getMayorPuja()));
            }

            @Override
            public void onFailure(@NonNull Call<UserMetrics> call, @NonNull Throwable t) { /* keep zeros */ }
        });
    }

    private String formatMoney(double v) {
        return String.format(Locale.getDefault(), "$ %,.0f", v);
    }
}
