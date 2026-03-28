package com.subastapp.model;

import java.util.List;

public class AuctionPage {
    private List<Auction> content;
    private int totalElements;
    private int totalPages;
    private int currentPage;

    public List<Auction> getContent() { return content; }
    public int getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
}
