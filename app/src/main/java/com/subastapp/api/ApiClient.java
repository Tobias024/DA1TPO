package com.subastapp.api;

import android.content.Context;

import com.subastapp.utils.SessionManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Singleton Retrofit client.
 * Attaches JWT Bearer token to every request.
 * 10.0.2.2 = localhost on the Android emulator host machine.
 */
public class ApiClient {
    // Use 10.0.2.2 for emulator; change to real IP/hostname for device testing
    public static final String BASE_URL = "http://10.0.2.2:8080/api/v1/";
    public static final String WS_URL   = "http://10.0.2.2:8080/ws";

    private static Retrofit retrofit;
    private static SessionManager sessionManager;

    public static void init(Context context) {
        sessionManager = new SessionManager(context);
    }

    public static Retrofit getClient() {
        if (retrofit == null) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(new AuthInterceptor())
                    .addInterceptor(logging)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }

    public static <T> T create(Class<T> service) {
        return getClient().create(service);
    }

    /** Attaches the JWT Authorization header to every request. */
    private static class AuthInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request original = chain.request();
            if (sessionManager == null) return chain.proceed(original);

            String token = sessionManager.getAccessToken();
            if (token == null) return chain.proceed(original);

            Request authenticated = original.newBuilder()
                    .header("Authorization", "Bearer " + token)
                    .build();
            return chain.proceed(authenticated);
        }
    }
}
