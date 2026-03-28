package com.subastapp.websocket;

import com.subastapp.api.ApiClient;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.schedulers.Schedulers;
import ua.naiksoftware.stomp.Stomp;
import ua.naiksoftware.stomp.StompClient;

/**
 * Wraps the STOMP WebSocket client for real-time auction bidding.
 * Subscribes to /topic/auctions/{auctionId} and dispatches events via Listener.
 */
public class BidWebSocketClient {

    public interface Listener {
        void onNewBid(String postorAlias, double monto, String timestamp, double limiteMin, double limiteMax);
        void onItemSold(boolean isWinner);
        void onAuctionFinished();
        void onConnected();
        void onDisconnected();
    }

    private final String auctionId;
    private final String jwtToken;
    private final Listener listener;

    private StompClient stompClient;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public BidWebSocketClient(String auctionId, String jwtToken, Listener listener) {
        this.auctionId = auctionId;
        this.jwtToken = jwtToken;
        this.listener = listener;
    }

    public void connect() {
        stompClient = Stomp.over(
                Stomp.ConnectionProvider.OKHTTP,
                ApiClient.WS_URL + "/websocket"
        );

        // Connection lifecycle
        disposables.add(
                stompClient.lifecycle()
                        .subscribeOn(Schedulers.io())
                        .observeOn(AndroidSchedulers.mainThread())
                        .subscribe(event -> {
                            switch (event.getType()) {
                                case OPENED:
                                    listener.onConnected();
                                    subscribeToAuction();
                                    break;
                                case CLOSED:
                                    listener.onDisconnected();
                                    break;
                                case ERROR:
                                    listener.onDisconnected();
                                    break;
                            }
                        })
        );

        stompClient.connect(
                java.util.Arrays.asList(
                        new ua.naiksoftware.stomp.dto.StompHeader("Authorization", "Bearer " + jwtToken)
                )
        );
    }

    private void subscribeToAuction() {
        String topic = "/topic/auctions/" + auctionId;
        disposables.add(
                stompClient.topic(topic)
                        .subscribeOn(Schedulers.io())
                        .observeOn(AndroidSchedulers.mainThread())
                        .subscribe(message -> {
                            try {
                                JsonObject json = JsonParser.parseString(message.getPayload()).getAsJsonObject();
                                String tipo = json.get("tipo").getAsString();
                                JsonObject data = json.getAsJsonObject("data");

                                switch (tipo) {
                                    case "NUEVA_PUJA":
                                        listener.onNewBid(
                                                data.get("postorAlias").getAsString(),
                                                data.get("monto").getAsDouble(),
                                                data.get("timestamp").getAsString(),
                                                data.get("limiteMinimo").getAsDouble(),
                                                data.get("limiteMaximo").getAsDouble()
                                        );
                                        break;
                                    case "ITEM_VENDIDO":
                                        boolean winner = data.has("ganadorEsTuUsuario")
                                                && data.get("ganadorEsTuUsuario").getAsBoolean();
                                        listener.onItemSold(winner);
                                        break;
                                    case "SUBASTA_FINALIZADA":
                                        listener.onAuctionFinished();
                                        break;
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        })
        );
    }

    public void disconnect() {
        disposables.clear();
        if (stompClient != null) {
            stompClient.disconnect();
        }
    }
}
