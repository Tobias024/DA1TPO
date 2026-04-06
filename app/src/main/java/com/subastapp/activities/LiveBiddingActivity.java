package com.subastapp.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.subastapp.api.ApiClient;
import com.subastapp.api.ApiService;
import com.subastapp.databinding.ActivityLiveBiddingBinding;
import com.subastapp.model.Auction;
import com.subastapp.model.Bid;
import com.subastapp.model.BidPage;
import com.subastapp.model.BidRequest;
import com.subastapp.utils.SessionManager;
import com.subastapp.websocket.BidWebSocketClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Full-screen bidding screen.
 * Started from AuctionDetailFragment with EXTRA_AUCTION_ID.
 * Uses OkHttp STOMP WebSocket for real-time bid updates.
 */
public class LiveBiddingActivity extends AppCompatActivity {

    public static final String EXTRA_AUCTION_ID = "auction_id";

    private ActivityLiveBiddingBinding binding;
    private ApiService apiService;
    private SessionManager sessionManager;
    private BidWebSocketClient wsClient;

    private String auctionId;
    private Auction auction;
    private List<Bid> bids = new ArrayList<>();
    private com.subastapp.adapters.BidAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityLiveBiddingBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        auctionId = getIntent().getStringExtra(EXTRA_AUCTION_ID);
        apiService = ApiClient.create(ApiService.class);
        sessionManager = new SessionManager(this);

        setupRecyclerView();
        loadAuction();
        connectWebSocket();

        binding.btnBack.setOnClickListener(v -> onBackPressed());
        binding.btnBid.setOnClickListener(v -> placeBid());
    }

    private void setupRecyclerView() {
        adapter = new com.subastapp.adapters.BidAdapter(this, bids);
        binding.rvBids.setAdapter(adapter);
        binding.rvBids.setLayoutManager(
                new androidx.recyclerview.widget.LinearLayoutManager(this));
    }

    private void loadAuction() {
        apiService.getAuctionDetail(auctionId).enqueue(new Callback<Auction>() {
            @Override
            public void onResponse(Call<Auction> call, Response<Auction> response) {
                if (response.isSuccessful() && response.body() != null) {
                    auction = response.body();
                    updateUI();
                }
            }
            @Override
            public void onFailure(Call<Auction> call, Throwable t) {
                Toast.makeText(LiveBiddingActivity.this, "Error cargando subasta", Toast.LENGTH_SHORT).show();
            }
        });

        // Load bid history
        apiService.getBidHistory(auctionId, 0, 50).enqueue(new Callback<BidPage>() {
            @Override
            public void onResponse(Call<BidPage> call, Response<BidPage> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Bid> history = response.body().getContent();
                    if (history != null) {
                        bids.addAll(history);
                        adapter.notifyDataSetChanged();
                    }
                }
            }
            @Override
            public void onFailure(Call<BidPage> call, Throwable t) {}
        });
    }

    private void updateUI() {
        if (auction == null) return;
        binding.tvAuctionTitle.setText(auction.getTitulo());

        var item = auction.getItemActual();
        if (item != null) {
            binding.tvLotNumber.setText(String.format("Lote #%d", item.getNumeroItem()));
            binding.tvItemDesc.setText(item.getDescripcion());
            if (item.getArtista() != null) {
                binding.tvArtist.setText("✏️ " + item.getArtista());
            }
            double bestOffer = item.getMejorOferta() > 0 ? item.getMejorOferta() : item.getPrecioBase();
            String currency = "USD".equals(auction.getMoneda()) ? "USD " : "$";
            binding.tvCurrentOffer.setText(String.format("%s %.2f", currency, bestOffer));
            binding.tvLimitMin.setText(String.format("Mín: %s %.2f", currency, item.getLimiteMinimo()));
            binding.tvLimitMax.setText(String.format("Máx: %s %.2f", currency, item.getLimiteMaximo()));
            binding.etBidAmount.setText(String.valueOf((long) Math.ceil(item.getLimiteMinimo())));
        }

        boolean canBid = auction.isUsuarioPuedePujar();
        binding.bidInputLayout.setVisibility(canBid ? android.view.View.VISIBLE : android.view.View.GONE);
        binding.cvWatchOnly.setVisibility(canBid ? android.view.View.GONE : android.view.View.VISIBLE);
        if (!canBid && auction.getMotivoNoPuede() != null) {
            binding.tvWatchOnly.setText("👁 Solo observando — " + auction.getMotivoNoPuede());
        }
    }

    private void connectWebSocket() {
        String token = sessionManager.getAccessToken();
        wsClient = new BidWebSocketClient(auctionId, token, new BidWebSocketClient.Listener() {
            @Override
            public void onNewBid(String postorAlias, double monto, String timestamp,
                                  double limiteMin, double limiteMax) {
                runOnUiThread(() -> {
                    // Add new bid to top of list
                    Bid newBid = new Bid();
                    adapter.addBidAtTop(postorAlias, monto, timestamp);

                    // Update UI
                    String currency = auction != null && "USD".equals(auction.getMoneda()) ? "USD " : "$";
                    binding.tvCurrentOffer.setText(String.format("%s %.2f", currency, monto));
                    binding.tvLimitMin.setText(String.format("Mín: %s %.2f", currency, limiteMin));
                    binding.tvLimitMax.setText(String.format("Máx: %s %.2f", currency, limiteMax));
                    binding.etBidAmount.setText(String.valueOf((long) Math.ceil(limiteMin)));
                    binding.tvConnected.setText("🔴 EN VIVO");
                });
            }

            @Override
            public void onItemSold(boolean isWinner) {
                runOnUiThread(() -> {
                    String msg = isWinner ? "🎉 ¡Felicitaciones! Ganaste este lote." : "Lote vendido.";
                    new AlertDialog.Builder(LiveBiddingActivity.this)
                            .setTitle("Lote cerrado")
                            .setMessage(msg)
                            .setPositiveButton("OK", null)
                            .show();
                });
            }

            @Override
            public void onAuctionFinished() {
                runOnUiThread(() -> {
                    new AlertDialog.Builder(LiveBiddingActivity.this)
                            .setTitle("Subasta finalizada")
                            .setMessage("La subasta ha concluido. Gracias por participar.")
                            .setPositiveButton("OK", (d, w) -> finish())
                            .show();
                });
            }

            @Override
            public void onConnected() {
                runOnUiThread(() -> binding.tvConnected.setText("🔴 EN VIVO"));
            }

            @Override
            public void onDisconnected() {
                runOnUiThread(() -> binding.tvConnected.setText("⬛ Desconectado"));
            }
        });
        wsClient.connect();
    }

    private void placeBid() {
        String amountStr = binding.etBidAmount.getText() != null
                ? binding.etBidAmount.getText().toString().trim() : "";
        if (amountStr.isEmpty()) {
            Toast.makeText(this, "Ingrese un monto válido", Toast.LENGTH_SHORT).show();
            return;
        }
        double amount;
        try { amount = Double.parseDouble(amountStr); }
        catch (NumberFormatException e) {
            Toast.makeText(this, "Monto inválido", Toast.LENGTH_SHORT).show();
            return;
        }

        binding.btnBid.setEnabled(false);
        String itemId = auction != null && auction.getItemActual() != null
                ? auction.getItemActual().getId() : "";

        apiService.placeBid(auctionId, new BidRequest(itemId, amount, ""))
                .enqueue(new Callback<Map<String, Object>>() {
                    @Override
                    public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                        binding.btnBid.setEnabled(true);
                        if (!response.isSuccessful()) {
                            String err = "No se pudo registrar la puja.";
                            Toast.makeText(LiveBiddingActivity.this, err, Toast.LENGTH_LONG).show();
                        }
                    }
                    @Override
                    public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                        binding.btnBid.setEnabled(true);
                        Toast.makeText(LiveBiddingActivity.this, "Error de conexión", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (wsClient != null) wsClient.disconnect();
        if (auctionId != null) {
            apiService.leaveAuction(auctionId).enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {}
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {}
            });
        }
    }
}
