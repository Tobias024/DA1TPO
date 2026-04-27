package com.subastapp.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;

import com.subastapp.R;
import com.subastapp.activities.MainActivity;
import com.subastapp.utils.SessionManager;

/** Pantalla Perfil (Doc) — datos del usuario + accesos a sub-secciones. */
public class ProfileFragment extends Fragment {

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SessionManager session = new SessionManager(requireContext());
        ((TextView) view.findViewById(R.id.tv_user_name)).setText(session.getUserName());
        ((TextView) view.findViewById(R.id.tv_user_email)).setText(session.getUserEmail());
        ((TextView) view.findViewById(R.id.tv_user_category)).setText(session.getUserCategory());

        view.findViewById(R.id.card_edit).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_profile_to_edit));
        view.findViewById(R.id.card_metrics).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_profile_to_metrics));
        view.findViewById(R.id.card_consignments).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_profile_to_consignments));
        view.findViewById(R.id.card_payments).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_profile_to_payments));
        view.findViewById(R.id.card_notifications).setOnClickListener(v ->
                Navigation.findNavController(view).navigate(R.id.action_profile_to_notifications));

        view.findViewById(R.id.btn_logout).setOnClickListener(v -> {
            session.clearSession();
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).onLogout();
            }
        });
    }
}
