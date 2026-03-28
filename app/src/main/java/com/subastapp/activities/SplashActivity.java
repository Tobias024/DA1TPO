package com.subastapp.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.animation.AlphaAnimation;
import android.view.animation.ScaleAnimation;
import android.view.animation.AnimationSet;

import androidx.appcompat.app.AppCompatActivity;

import com.subastapp.R;
import com.subastapp.utils.SessionManager;

public class SplashActivity extends AppCompatActivity {

    private static final int SPLASH_DURATION_MS = 2500;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        // Animate logo: fade-in + scale-up
        var logoContainer = findViewById(R.id.logo_container);
        AnimationSet anim = new AnimationSet(true);

        AlphaAnimation fadeIn = new AlphaAnimation(0f, 1f);
        fadeIn.setDuration(800);

        ScaleAnimation scale = new ScaleAnimation(
                0.7f, 1f, 0.7f, 1f,
                ScaleAnimation.RELATIVE_TO_SELF, 0.5f,
                ScaleAnimation.RELATIVE_TO_SELF, 0.5f
        );
        scale.setDuration(800);

        anim.addAnimation(fadeIn);
        anim.addAnimation(scale);
        logoContainer.startAnimation(anim);

        // Navigate after delay
        new Handler(Looper.getMainLooper()).postDelayed(this::navigateToNext, SPLASH_DURATION_MS);
    }

    private void navigateToNext() {
        SessionManager session = new SessionManager(this);
        Intent intent;
        if (session.isLoggedIn()) {
            intent = new Intent(this, MainActivity.class);
        } else {
            intent = new Intent(this, AuthActivity.class);
        }
        startActivity(intent);
        finish();
    }
}
