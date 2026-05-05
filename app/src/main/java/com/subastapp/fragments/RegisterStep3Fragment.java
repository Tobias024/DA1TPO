package com.subastapp.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.subastapp.R;
import com.subastapp.activities.AuthActivity;

/** Confirmación 2/2 — selección método de pago inicial + T&C (Doc). */
public class RegisterStep3Fragment extends Fragment {

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_register_step3, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        CheckBox cbTyc = view.findViewById(R.id.cb_tyc);
        view.findViewById(R.id.btn_finalizar).setOnClickListener(v -> {
            if (!cbTyc.isChecked()) {
                Toast.makeText(requireContext(), R.string.aceptar_tyc, Toast.LENGTH_SHORT).show();
                return;
            }
            // Persistencia del medio de pago seleccionado se hace via /payment-methods POST
            if (getActivity() instanceof AuthActivity) {
                ((AuthActivity) getActivity()).onAuthSuccess();
            }
        });
    }
}
