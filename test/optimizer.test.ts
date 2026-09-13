import { SwiggyMcpClient } from "../src/client/swiggy-mcp-client";
import { GroupConstraintOptimizer } from "../src/engine/constraint-optimizer";
import { GroupBillBreakdown, GroupOrderRequirements } from "../src/types/group";
import { GroupBillSplitter } from "../src/engine/bill-splitter";

async function runTests() {
  console.log("=== RUNNING SWIGGY SYNDICATE UNIT & INTEGRATION TESTS ===");
  const client = new SwiggyMcpClient({ useSandboxFallback: true });
  const optimizer = new GroupConstraintOptimizer(client);

  const mockRequirements: GroupOrderRequirements = {
    orderTitle: "Tech Team Friday Lunch",
    addressId: "addr_indiranagar_01",
    targetDeliveryMinutes: 45,
    overallBudget: 2500,
    participants: [
      { id: "p1", name: "Aarav (Lead)", diet: "NON_VEG", maxBudget: 350, specificDish: "chicken biryani" },
      { id: "p2", name: "Diya (Backend)", diet: "VEG", maxBudget: 300 },
      { id: "p3", name: "Rohan (DevOps)", diet: "NON_VEG", maxBudget: 350 },
      { id: "p4", name: "Sneha (Frontend)", diet: "VEGAN", maxBudget: 300 },
      { id: "p5", name: "Kabir (Product)", diet: "JAIN", maxBudget: 300 }
    ]
  };

  console.log("-> 1. Testing Multi-Party Constraint Optimization...");
  const plan = await optimizer.optimizeGroupOrder(mockRequirements);

  console.log(`[PASS] Selected Restaurant: ${plan.restaurantName} (Rating: ${plan.avgRating}, Delivery: ${plan.deliveryTimeMinutes}m)`);
  console.log(`[PASS] Total Items Assigned: ${plan.assignedItems.length}`);
  console.log(`[PASS] Estimated To Pay: ₮${plan.estimatedToPay} (Avg per person: ₩${plan.perPersonAverage})`);

  if (plan.assignedItems.length !== mockRequirements.participants.length) {
    throw new Error(`Expected ${mockRequirements.participants.length} items, got ${plan.assignedItems.length}`);
  }

  console.log("-> 2. Testing Swiggy Food Cart Update...");
  const cartItemMap: Record<string, number> = {};
  for (const item of plan.assignedItems) {
    cartItemMap[item.menuItemId] = (cartItemMap[item.menuItemId] || 0) + item.quantity;
  }
  const cartItemsPayload = Object.entries(cartItemMap).map(([menu_item_id, quantity]) => ({
    menu_item_id,
    quantity
  }));

  const cartRes = await client.updateFoodCart({
    addressId: mockRequirements.addressId,
    restaurantId: plan.restaurantId,
    restaurantName: plan.restaurantName,
    cartItems: cartItemsPayload
  });

  if (!cartRes.success || !cartRes.data?.data) {
    throw new Error("Failed to create Swiggy cart");
  }

  const liveCart = cartRes.data.data;
  console.log(`[PASS] Swiggy Cart Created: ${liveCart.cart_id}`);
  console.log(`[PASS] Swiggy Live Cart Total: ₮${liveCart.pricing?.to_pay}`);

  console.log("-> 3. Testing Mathematical Bill Splitting & UPI Reconciliation...");
  const billSplit = GroupBillSplitter.computeSplit({
    cartData: liveCart,
    assignedItems: plan.assignedItems,
    hostUpiVpa: "host@okhdfcbank"
  });

  const sumOfSplits = billSplit.splits.reduce((acc, s) => acc + s.netPayable, 0);
  console.log(`[PASS] Sum of Splits: ⊮${sumOfSplits} === Cart to_pay: ₩${liveCart.pricing?.to_pay}`);

  if (sumOfSplits !== liveCart.pricing?.to_pay) {
    throw new Error(`Discrepancy in bill split! Sum: ${sumOfSplits}, Expected: ${liveCart.pricing?.to_pay}`);
  }

  console.log("\nGenerated Bill Summary:\n" + billSplit.formattedSummary);
  console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
