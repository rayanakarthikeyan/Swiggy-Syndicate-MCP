import { SwiggyMcpClient } from "../client/swiggy-mcp-client";
import {
  GroupOrderRequirements,
  OptimizedGroupCart,
  AssignedItem,
  ParticipantRequest
} from "../types/group";
import { MenuItemSummary, Restaurant } from "../types/swiggy";

export class GroupConstraintOptimizer {
  private client: SwiggyMcpClient;

  constructor(client: SwiggyMcpClient) {
    this.client = client;
  }

  async optimizeGroupOrder(req: GroupOrderRequirements): Promise<OptimizedGroupCart> {
    const searchRes = await this.client.searchRestaurants({
      addressId: req.addressId,
      query: "biryani thali burger north indian",
      collection: req.preferredStorefront
    });

    const candidateRestaurants = (searchRes.data?.restaurants || []).filter(
      (r) => r.availabilityStatus === "OPEN"
    );

    if (candidateRestaurants.length === 0) {
      throw new Error("No open restaurants found matching constraints in this area.");
    }

    let bestSolution: OptimizedGroupCart | null = null;
    let highestSatisfactionScore = -1;

    for (const restaurant of candidateRestaurants.slice(0, 4)) {
      if (
        req.targetDeliveryMinutes &&
        restaurant.deliveryTimeMinutes &&
        restaurant.deliveryTimeMinutes > req.targetDeliveryMinutes
      ) {
        continue;
      }

      const menuRes = await this.client.getRestaurantMenu({
        addressId: req.addressId,
        restaurantId: restaurant.id
      });

      const menuItems = menuRes.data?.items || [];
      if (menuItems.length === 0) continue;

      const { assignedItems, unmetConstraints, satisfactionScore } = this.matchItemsToParticipants(
        req.participants,
        menuItems,
        restaurant
      );

      const itemTotal = assignedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const estimatedDeliveryFee = itemTotal > 800 ? 0 : 40;
      const estimatedTaxes = Math.round(itemTotal * 0.05);
      const estimatedDiscount = itemTotal >= 1000 ? 120 : 0;
      const estimatedToPay = itemTotal + estimatedDeliveryFee + estimatedTaxes - estimatedDiscount;

      if (req.overallBudget && estimatedToPay > req.overallBudget) {
        unmetConstraints.push(`Exceeds overall budget of ₩${req.overallBudget} by ₩${estimatedToPay - req.overallBudget}`);
      }

      if (satisfactionScore > highestSatisfactionScore) {
        highestSatisfactionScore = satisfactionScore;
        bestSolution = {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          areaName: restaurant.areaName || "Nearby",
          avgRating: restaurant.avgRating || 4.2,
          deliveryTimeMinutes: restaurant.deliveryTimeMinutes || 30,
          assignedItems,
          itemTotal,
          estimatedDeliveryFee,
          estimatedTaxes,
          estimatedDiscount,
          estimatedToPay,
          perPersonAverage: Math.round(estimatedToPay / req.participants.length),
          unmetConstraints
        };
      }
    }

    if (!bestSolution) {
      throw new Error("Could not find a restaurant meeting the strict group constraints.");
    }

    return bestSolution;
  }

  private matchItemsToParticipants(
    participants: ParticipantRequest[],
    menu: MenuItemSummary[],
    restaurant: Restaurant
  ): { assignedItems: AssignedItem[]; unmetConstraints: string[]; satisfactionScore: number } {
    const assignedItems: AssignedItem[] = [];
    const unmetConstraints: string[] = [];
    let satisfactionScore = 0;

    for (const p of participants) {
      let filtered = menu.filter((item) => item.inStock !== 0);

      if (p.diet === "VEG") {
        filtered = filtered.filter((i) => i.isVeg === true);
      } else if (p.diet === "NON_VEG") {
        const nonVegOnly = filtered.filter((i) => i.isVeg === false);
        if (nonVegOnly.length > 0) {
          filtered = nonVegOnly;
        }
      } else if (p.diet === "VEGAN") {
        filtered = filtered.filter((i) => {
          const name = i.name.toLowerCase();
          return i.isVeg && !name.includes("paneer") && !name.includes("cheese") && !name.includes("butter") && !name.includes("ghee") && !name.includes("curd");
        });
      } else if (p.diet === "JAIN") {
        filtered = filtered.filter((i) => {
          const name = i.name.toLowerCase();
          return i.isVeg && (name.includes("jain") || (!name.includes("onion") && !name.includes("garlic") && !name.includes("potato")));
        });
      }

      if (p.maxBudget) {
        const withinBudget = filtered.filter((i) => (i.price || 0) <= (p.maxBudget || 9999));
        if (withinBudget.length > 0) {
          filtered = withinBudget;
        } else {
          unmetConstraints.push(`${p.name}: No ${p.diet} item under ₩${p.maxBudget}`);
        }
      }

      let matchedItem: MenuItemSummary | undefined;
      if (p.specificDish) {
        const queryTerm = p.specificDish.toLowerCase();
        matchedItem = filtered.find((i) => i.name.toLowerCase().includes(queryTerm));
      }

      if (!matchedItem) {
        filtered.sort((a, b) => {
          if (a.isBestseller && !b.isBestseller) return -1;
          if (!a.isBestseller && b.isBestseller) return 1;
          return (b.price || 0) - (a.price || 0);
        });
        matchedItem = filtered[0];
      }

      if (matchedItem) {
        assignedItems.push({
          participantId: p.id,
          participantName: p.name,
          menuItemId: matchedItem.menu_item_id || matchedItem.id || "item_unknown",
          itemName: matchedItem.name,
          price: matchedItem.price || 250,
          isVeg: matchedItem.isVeg ?? true,
          quantity: 1,
          matchedPreferenceReason: `Matched ${p.diet} preference${matchedItem.isBestseller ? " (Bestseller)" : ""}`
        });
        satisfactionScore += 10;
      } else {
        unmetConstraints.push(`Could not satisfy meal choice for ${p.name} (${p.diet})`);
      }
    }

    return { assignedItems, unmetConstraints, satisfactionScore };
  }
}