package com.subastapp.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.subastapp.R;
import com.subastapp.model.Bid;

import java.util.ArrayList;
import java.util.List;

public class BidAdapter extends RecyclerView.Adapter<BidAdapter.BidViewHolder> {

    private final Context context;
    private final List<Bid> bids;

    // Simple holder for real-time additions
    private final List<BidItem> bidItems = new ArrayList<>();

    public BidAdapter(Context context, List<Bid> bids) {
        this.context = context;
        this.bids = bids;
        for (Bid b : bids) {
            String alias = b.getPostor() != null ? b.getPostor().getAlias() : "Postor";
            bidItems.add(new BidItem(alias, b.getMonto(), b.getTimestamp()));
        }
    }

    public void addBidAtTop(String alias, double monto, String timestamp) {
        bidItems.add(0, new BidItem(alias, monto, timestamp));
        notifyItemInserted(0);
    }

    @NonNull
    @Override
    public BidViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_bid, parent, false);
        return new BidViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull BidViewHolder holder, int position) {
        BidItem item = bidItems.get(position);
        holder.tvAlias.setText(item.alias);
        holder.tvMonto.setText(String.format("$ %.2f", item.monto));
        holder.tvTimestamp.setText(item.timestamp != null && item.timestamp.length() > 10
                ? item.timestamp.substring(11, 19) : item.timestamp);

        // Highlight top bid in gold
        int color = position == 0
                ? context.getResources().getColor(R.color.gold, null)
                : context.getResources().getColor(R.color.text_secondary, null);
        holder.tvMonto.setTextColor(color);
    }

    @Override
    public int getItemCount() { return bidItems.size(); }

    static class BidViewHolder extends RecyclerView.ViewHolder {
        TextView tvAlias, tvMonto, tvTimestamp;
        BidViewHolder(View itemView) {
            super(itemView);
            tvAlias = itemView.findViewById(R.id.tv_bid_alias);
            tvMonto = itemView.findViewById(R.id.tv_bid_monto);
            tvTimestamp = itemView.findViewById(R.id.tv_bid_timestamp);
        }
    }

    private static class BidItem {
        String alias, timestamp;
        double monto;
        BidItem(String alias, double monto, String timestamp) {
            this.alias = alias;
            this.monto = monto;
            this.timestamp = timestamp;
        }
    }
}
