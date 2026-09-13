import fetch from "node-fetch";
import { SwiggyResponse, Restaurant, MenuItemSummary, FoodCartData, UpdateCartItemInput } from "../types/swiggy";
import { SANDBOX_RESTAURANTS, SANDBOX_MENUS } from "./sandbox-data";

export interface SwiggyClientConfig {
  endpoint?: string;
  accessToken?: string;
  useSandboxFallback?: boolean;
}

export class SwiggyMcpClient {
  private endpoint: string;
  private accessToken?: string;
  private useSandboxFallback: boolean;

  constructor(config?: SwiggyClientConfig) {
    this.endpoint = config?.endpoint || "https://mcp.swiggy.com/food";
    this.accessToken = config?.accessToken || process.env.SWIGGY_TOKEN;
    this.useSandboxFallback = config?.useSandboxFallback ?? true;
  }

  private async callRemoteTool<T>(name: string, args: Record<string, any>): Promise<SwiggyResponse<T>> {
    if (!this.accessToken) {
      if (this.useSandboxFallback) {
        return { success: false, error: { message: "No SWIGGY_TOKEN set, falling back to sandbox" } };
      }
      throw new Error("Missing SWIGGY_TOKEN for live Swiggy MCP call");
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name,
          arguments: args
        },
        id: Date.now()
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: {message: `HTTP ${res.status}: ${text}`}
      };
    }

    const rpcResponse: any = await res.json();
    if (rpcResponse.error) {
      return {
        success: false,
        error: { message: rpcResponse.error.message || "JSON-RPC error" }
      };
    }

    return rpcResponse.result as SwiggyResponse<T>;
  }

  async searchRestaurants(params: {
    addressId: string;
    query: string;
    collection?: "EATRIGHT" | "BOLT" | "STORE_99";
  }): Promise<SwiggyResponse<{ restaurants: Restaurant[] }>> {
    if (this.accessToken) {
      const res = await this.callRemoteTool<{ restaurants: Restaurant[] }>("search_restaurants", params);
      if (res.success) return res;
    }

    const queryLower = params.query.toLowerCase();
    const filtered = SANDBOX_RESTAURANTS.filter((r: Restaurant) => {
      const matchQuery =
        r.name.toLowerCase().includes(queryLower) ||
        r.cuisines.some((c: string) => c.toLowerCase().includes(queryLower));
      return matchQuery && r.availabilityStatus === "OPEN";
    });

    return {
      success: true,
      data: {
        restaurants: filtered.length > 0 ? filtered : SANDBOX_RESTAURANTS
      }
    };
  }

  async getRestaurantMenu(params: {
    addressId: string;
    restaurantId: string;
  }): Promise<SwiggyResponse<{ items: MenuItemSummary[]; restaurant?: { id: string; name: string } }>> {
    if (this.accessToken) {
      const res = await this.callRemoteTool<any>("get_restaurant_menu", params);
      if (res.success) return res;
    }

    const items = SANDBOX_MENUS[params.restaurantId] || SANDBOX_MENUS["rest_meghana_01"];
    const rest = SANDBOX_RESTAURANTS.find((r: Restaurant) => r.id === params.restaurantId) || SANDBOX_RESTAURANTS[0];

    return {
      success: true,
      data: {
        items: items.slice(0, 150),
        restaurant: {
          id: rest.id,
          name: rest.name
        }
      }
    };
  }

  async updateFoodCart(params: {
    restaurantId: string;
    addressId: string;
    cartItems: UpdateCartItemInput[];
    restaurantName?: string;
  }): Promise<SwiggyResponse<{ data: FoodCartData }>> {
    if (this.accessToken) {
      const res = await this.callRemoteTool<{ data: FoodCartData }>("update_food_cart", params);
      if (res.success) return res;
    }

    const menu = SANDBOX_MENUS[params.restaurantId] || SANDBOX_MENUS["rest_meghana_01"];
    let subtotal = 0;
    const items = params.cartItems.map((ci) => {
      const found = menu.find((m) => m.menu_item_id === ci.menu_item_id || m.id === ci.menu_item_id);
      const price = found?.price || 250;
      const itemSubtotal = price * ci.quantity;
      subtotal += itemSubtotal;
      return {
        menu_item_id: ci.menu_item_id,
        name: found?.name || "Group Selected Dish",
        quantity: ci.quantity,
        is_veg: found?.isVeg ?? true,
        subtotal: itemSubtotal,
        total: itemSubtotal,
        final_price: itemSubtotal,
        in_stock: true
      };
    });

    const deliveryFee = subtotal > 1000 ? 0 : 45;
    const taxes = Math.round(subtotal * 0.05);
    const toPay = subtotal + deliveryFee + taxes;

    return {
      success: true,
      data: {
        data: {
          cart_id: "cart_grp_" + Math.random().toString(36).substring(2, 9),
          result: "SUCCESS",
          restaurant: {
            id: params.restaurantId,
            name: params.restaurantName || "Selected Restaurant"
          },
          items,
          item_count: items.reduce((acc, it) => acc + it.quantity, 0),
          pricing: {
            item_total: subtotal,
            delivery_charge: deliveryFee,
            taxes_and_charges: taxes,
            to_pay: toPay
          },
          offers: {
            coupon_applied: deliveryFee === 0 ? "FREEDELL" : null,
            free_delivery_applied: deliveryFee === 0
          }
        }
      }
    };
  }
}