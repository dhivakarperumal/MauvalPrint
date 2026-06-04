-- Migration: Add images_by_variant column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images_by_variant JSON NULL AFTER images;
