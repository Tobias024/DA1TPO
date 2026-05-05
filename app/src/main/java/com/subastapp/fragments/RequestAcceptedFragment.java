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
import com.subastapp.R;

/** Solicitud Aceptada (Doc) — propuesta de subasta + accept/reject. */
public class RequestAcceptedFragment extends Fragment {
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_request_accepted, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        view.findViewById(R.id.btn_aceptar).setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Propuesta aceptada", Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).popBackStack();
        });
        view.findViewById(R.id.btn_rechazar).setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Propuesta rechazada", Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).popBackStack();
        });
    }
}
