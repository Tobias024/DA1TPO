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
import com.subastapp.model.LoginResponse;
import com.subastapp.utils.SessionManager;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/** Confirmación 1/2 — set password con token de mail (Doc). */
public class RegisterStep2Fragment extends Fragment {

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_register_step2, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        View btn = view.findViewById(R.id.btn_continuar);
        if (btn != null) btn.setOnClickListener(v -> submit(view));
    }

    private void submit(View root) {
        String token = textOf(root, R.id.et_token);
        String password = textOf(root, R.id.et_password);
        String confirm = textOf(root, R.id.et_confirm_password);

        if (TextUtils.isEmpty(token) || TextUtils.isEmpty(password) || TextUtils.isEmpty(confirm)) {
            Toast.makeText(requireContext(), R.string.error_campos_requeridos, Toast.LENGTH_SHORT).show();
            return;
        }
        if (!password.equals(confirm)) {
            Toast.makeText(requireContext(), "Las contraseñas no coinciden", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("registrationToken", token);
        body.put("password", password);
        body.put("passwordConfirm", confirm);

        ApiClient.create(ApiService.class).registerStep2(body).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(@NonNull Call<LoginResponse> call, @NonNull Response<LoginResponse> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse body = response.body();
                    LoginResponse.UserSummary u = body.getUser();
                    new SessionManager(requireContext()).saveSession(
                            body.getAccessToken(), body.getRefreshToken(),
                            u.getId(), u.getNombre(), u.getEmail(), u.getCategoria());
                    Navigation.findNavController(root).navigate(R.id.action_register2_to_register3);
                } else {
                    Toast.makeText(requireContext(), R.string.error_conexion, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<LoginResponse> call, @NonNull Throwable t) {
                if (isAdded()) Toast.makeText(requireContext(), R.string.error_conexion, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private String textOf(View root, int id) {
        View v = root.findViewById(id);
        if (v instanceof EditText && ((EditText) v).getText() != null) {
            return ((EditText) v).getText().toString().trim();
        }
        return "";
    }
}
