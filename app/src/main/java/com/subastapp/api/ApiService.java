package com.subastapp.api;

import com.subastapp.model.LoginRequest;
import com.subastapp.model.LoginResponse;
import com.subastapp.model.Auction;
import com.subastapp.model.AuctionPage;
import com.subastapp.model.Bid;
import com.subastapp.model.BidRequest;
import com.subastapp.model.Consignment;
import com.subastapp.model.MedioPago;
import com.subastapp.model.Notification;
import com.subastapp.model.UserProfile;
import com.subastapp.model.UserMetrics;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    // --- AUTH ---
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/register/step1")
    Call<Map<String, String>> registerStep1(@Body Map<String, String> body);

    @POST("auth/register/step2")
    Call<LoginResponse> registerStep2(@Body Map<String, String> body);

    @POST("auth/refresh")
    Call<Map<String, String>> refreshToken(@Body Map<String, String> body);

    // --- USER ---
    @GET("users/me")
    Call<UserProfile> getMyProfile();

    @GET("users/me/metrics")
    Call<UserMetrics> getMyMetrics();

    // --- AUCTIONS ---
    @GET("auctions")
    Call<AuctionPage> getAuctions(
            @Query("estado") String estado,
            @Query("page") int page,
            @Query("size") int size
    );

    @GET("auctions/{id}")
    Call<Auction> getAuctionDetail(@Path("id") String auctionId);

    @GET("auctions/{id}/catalog")
    Call<List<com.subastapp.model.Piece>> getCatalog(@Path("id") String auctionId);

    @POST("auctions/{id}/join")
    Call<Map<String, Object>> joinAuction(@Path("id") String auctionId);

    @POST("auctions/{id}/leave")
    Call<Map<String, Object>> leaveAuction(@Path("id") String auctionId);

    // --- BIDS ---
    @POST("auctions/{auctionId}/bids")
    Call<Map<String, Object>> placeBid(
            @Path("auctionId") String auctionId,
            @Body BidRequest request
    );

    @GET("auctions/{auctionId}/bids")
    Call<com.subastapp.model.BidPage> getBidHistory(
            @Path("auctionId") String auctionId,
            @Query("page") int page,
            @Query("size") int size
    );

    // --- PAYMENT METHODS ---
    @GET("payment-methods")
    Call<List<MedioPago>> getPaymentMethods();

    @POST("payment-methods")
    Call<Map<String, String>> addPaymentMethod(@Body Map<String, Object> body);

    @DELETE("payment-methods/{id}")
    Call<Void> deletePaymentMethod(@Path("id") String id);

    // --- CONSIGNMENTS ---
    @GET("consignments")
    Call<List<Consignment>> getConsignments();

    @GET("consignments/{id}")
    Call<Consignment> getConsignmentDetail(@Path("id") String id);

    @POST("consignments")
    Call<Map<String, String>> createConsignment(@Body Map<String, Object> body);

    @PATCH("consignments/{id}/accept-offer")
    Call<Map<String, String>> acceptOffer(@Path("id") String id);

    @PATCH("consignments/{id}/reject-offer")
    Call<Map<String, String>> rejectOffer(@Path("id") String id, @Body Map<String, String> body);

    // --- NOTIFICATIONS ---
    @GET("notifications")
    Call<com.subastapp.model.NotificationPage> getNotifications(
            @Query("page") int page,
            @Query("size") int size
    );

    @PATCH("notifications/{id}/read")
    Call<Map<String, String>> markAsRead(@Path("id") String id);

    // --- SALES ---
    @GET("sales")
    Call<List<com.subastapp.model.Sale>> getMySales();
}
