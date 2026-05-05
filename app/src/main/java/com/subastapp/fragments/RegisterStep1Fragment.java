package com.subastapp.fragments;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;

import com.subastapp.R;
import com.subastapp.api.ApiClient;
import com.subastapp.api.ApiService;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/** Registro — Etapa 1 (datos personales + foto DNI). */
public class RegisterStep1Fragment extends Fragment {

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_register_step1, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        View btn = view.findViewById(R.id.btn_continuar);
        if (btn != null) btn.setOnClickListener(v -> submit(view));
    }

    private void submit(View root) {
        Map<String, String> body = new HashMap<>();
        putIfPresent(body, "documento", root, R.id.et_documento);
        putIfPresent(body, "nombre", root, R.id.et_nombre);
        putIfPresent(body, "apellido", root, R.id.et_apellido);
        putIfPresent(body, "email", root, R.id.et_email);
        putIfPresent(body, "domicilioLegal", root, R.id.et_domicilio);
        putIfPresent(body, "paisOrigen", root, R.id.et_pais);

        if (TextUtils.isEmpty(body.get("documento")) || TextUtils.isEmpty(body.get("nombre"))
                || TextUtils.isEmpty(body.get("apellido")) || TextUtils.isEmpty(body.get("email"))) {
            Toast.makeText(requireContext(), R.string.error_campos_requeridos, Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.create(ApiService.class).registerStep1(body).enqueue(new Callback<Map<String, String>>() {
            @Override
            public void onResponse(@NonNull Call<Map<String, String>> call, @NonNull Response<Map<String, String>> response) {
                if (!isAdded()) return;
                if (response.isSuccessful()) {
                    Toast.makeText(requireContext(), "Solicitud enviada. Revisá tu mail.", Toast.LENGTH_LONG).show();
                    Navigation.findNavController(root).navigate(R.id.action_register1_to_register2);
                } else {
                    Toast.makeText(requireContext(), R.string.error_conexion, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<Map<String, String>> call, @NonNull Throwable t) {
                if (isAdded()) Toast.makeText(requireContext(), R.string.error_conexion, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void putIfPresent(Map<String, String> body, String key, View root, int id) {
        View v = root.findViewById(id);
        if (v instanceof EditText) {
            CharSequence cs = ((EditText) v).getText();
            if (cs != null) body.put(key, cs.toString().trim());
        }
    }
}
