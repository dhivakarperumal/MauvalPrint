-- Migration: Add size_charts and price_by_type columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS size_charts JSON NULL AFTER size_chart_image,
ADD COLUMN IF NOT EXISTS price_by_type JSON NULL AFTER size_charts;
