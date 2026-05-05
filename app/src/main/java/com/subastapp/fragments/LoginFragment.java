package com.subastapp.fragments;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;

import com.subastapp.R;
import com.subastapp.activities.AuthActivity;
import com.subastapp.api.ApiClient;
import com.subastapp.api.ApiService;
import com.subastapp.databinding.FragmentLoginBinding;
import com.subastapp.model.LoginRequest;
import com.subastapp.model.LoginResponse;
import com.subastapp.utils.SessionManager;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginFragment extends Fragment {

    private FragmentLoginBinding binding;
    private ApiService apiService;
    private SessionManager sessionManager;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentLoginBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        apiService = ApiClient.create(ApiService.class);
        sessionManager = new SessionManager(requireContext());

        binding.btnLogin.setOnClickListener(v -> attemptLogin());
        binding.btnRegister.setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_login_to_register1));
    }

    private void attemptLogin() {
        String documento = binding.etDocumento.getText() != null ? binding.etDocumento.getText().toString().trim() : "";
        String password = binding.etPassword.getText() != null ? binding.etPassword.getText().toString() : "";

        if (TextUtils.isEmpty(documento) || TextUtils.isEmpty(password)) {
            showError(getString(R.string.error_campos_requeridos));
            return;
        }

        setLoading(true);

        apiService.login(new LoginRequest(documento, password)).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(@NonNull Call<LoginResponse> call, @NonNull Response<LoginResponse> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse body = response.body();
                    LoginResponse.UserSummary user = body.getUser();
                    sessionManager.saveSession(
                            body.getAccessToken(),
                            body.getRefreshToken(),
                            user.getId(),
                            user.getNombre(),
                            user.getEmail(),
                            user.getCategoria()
                    );
                    if (getActivity() instanceof AuthActivity) {
                        ((AuthActivity) getActivity()).onAuthSuccess();
                    }
                } else if (response.code() == 401) {
                    showError(getString(R.string.error_credenciales));
                } else if (response.code() == 403) {
                    showError("Usuario suspendido. Regularice su situación.");
                } else {
                    showError(getString(R.string.error_conexion));
                }
            }

            @Override
            public void onFailure(@NonNull Call<LoginResponse> call, @NonNull Throwable t) {
                setLoading(false);
                showError(getString(R.string.error_conexion));
            }
        });
    }

    private void showError(String message) {
        binding.errorContainer.setVisibility(View.VISIBLE);
        binding.tvError.setText(message);
    }

    private void setLoading(boolean loading) {
        binding.btnLogin.setEnabled(!loading);
        binding.btnLogin.setText(loading ? "Ingresando..." : getString(R.string.enter));
        binding.errorContainer.setVisibility(View.GONE);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
