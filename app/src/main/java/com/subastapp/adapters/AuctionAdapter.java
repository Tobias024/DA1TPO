package com.subastapp.adapters;

import android.content.Context;
import android.view.*;
import android.widget.*;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.subastapp.R;
import com.subastapp.model.Auction;
import java.util.List;

public class AuctionAdapter extends RecyclerView.Adapter<AuctionAdapter.AuctionViewHolder> {

    public interface OnAuctionClick {
        void onClick(Auction auction);
    }

    private final Context context;
    private List<Auction> auctions;
    private final OnAuctionClick clickListener;

    public AuctionAdapter(Context context, List<Auction> auctions, OnAuctionClick clickListener) {
        this.context = context;
        this.auctions = auctions;
        this.clickListener = clickListener;
    }

    public void updateList(List<Auction> newList) {
        this.auctions = newList;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public AuctionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_auction, parent, false);
        return new AuctionViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AuctionViewHolder holder, int position) {
        Auction a = auctions.get(position);
        holder.tvTitle.setText(a.getTitulo());
        holder.tvLocation.setText(a.getUbicacion());
        holder.tvCurrency.setText(a.getMoneda());

        // Status badge color
        switch (a.getEstado()) {
            case "EN_CURSO":
                holder.tvStatus.setText("🔴 En vivo");
                holder.tvStatus.setTextColor(ContextCompat.getColor(context, R.color.red_live));
                break;
            case "ABIERTA":
                holder.tvStatus.setText("✅ Abierta");
                holder.tvStatus.setTextColor(ContextCompat.getColor(context, R.color.green_live));
                break;
            case "PROXIMA":
                holder.tvStatus.setText("📅 Próxima");
                holder.tvStatus.setTextColor(ContextCompat.getColor(context, R.color.blue_upcoming));
                break;
            default:
                holder.tvStatus.setText("Cerrada");
                holder.tvStatus.setTextColor(ContextCompat.getColor(context, R.color.text_muted));
                break;
        }

        // Category
        holder.tvCategory.setText(a.getCategoriaRequerida());

        // Rematador
        if (a.getRematador() != null) {
            holder.tvAuctioneer.setVisibility(View.VISIBLE);
            holder.tvAuctioneer.setText("⚖️ " + a.getRematador().getNombre());
        } else {
            holder.tvAuctioneer.setVisibility(View.GONE);
        }

        holder.itemView.setOnClickListener(v -> clickListener.onClick(a));
    }

    @Override
    public int getItemCount() {
        return auctions != null ? auctions.size() : 0;
    }

    static class AuctionViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvLocation, tvStatus, tvCategory, tvAuctioneer, tvCurrency;

        AuctionViewHolder(View view) {
            super(view);
            tvTitle = view.findViewById(R.id.tv_auction_title);
            tvLocation = view.findViewById(R.id.tv_location);
            tvStatus = view.findViewById(R.id.tv_status);
            tvCategory = view.findViewById(R.id.tv_category);
            tvAuctioneer = view.findViewById(R.id.tv_auctioneer);
            tvCurrency = view.findViewById(R.id.tv_currency);
        }
    }
}
