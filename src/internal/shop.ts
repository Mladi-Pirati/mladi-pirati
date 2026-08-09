export interface ShopItemImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: string;
  sizes: string[];
  status: string;
  images: ShopItemImage[];
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  estimatedDeliveryTime: string;
  price: number;
}
