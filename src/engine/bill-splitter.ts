import { FoodCartData } from "../types/swiggy";
import { AssignedItem, GroupBillBreakdown, ParticipantSplit } from "../types/group";

export class GroupBillSplitter {
  static computeSplit(params: {
    cartData: FoodCartData;
    assignedItems: AssignedItem[];
    hostUpiVpa?: string;
  }): GroupBillBreakdown {
    const { cartData, assignedItems, hostUpiVpa = "swiggy.group@upi" } = params;
    const pricing = cartData.pricing || {
      item_total: 0,
      delivery_charge: 0,
      taxes_and_charges: 0,
      to_pay: 0
    };

    const restaurantName = cartData.restaurant?.name || "Swiggy Order";
    const itemTotal = pricing.item_total || 1;
    const extraCharges = (pricing.delivery_charge || 0) + (pricing.taxes_and_charges || 0);
    const totalDiscount = (cartData.offers?.coupon_discount || 0);

    const participantMap: Record<string, {
      name: string;
      items: Array<{ name: string; price: number; quantity: number }>;
      subtotal: number;
    }> = {};

    for (const item of assignedItems) {
      if (!participantMap[item.participantId]) {
        participantMap[item.participantId] = {
          name: item.participantName,
          items: [],
          subtotal: 0
        };
      }
      participantMap[item.participantId].items.push({
        name: item.itemName,
        price: item.price,
        quantity: item.quantity
      });
      participantMap[item.participantId].subtotal += item.price * item.quantity;
    }

    const splits: ParticipantSplit[] = [];
    let runningNetSum = 0;
    const participantEntries = Object.entries(participantMap);

    participantEntries.forEach(([id, data], idx) => {
      const proportion = data.subtotal / itemTotal;
      const shareOfCharges = Math.round(extraCharges * proportion);
      const shareOfDiscount = Math.round(totalDiscount * proportion);

      let net = data.subtotal + shareOfCharges - shareOfDiscount;

      if (idx === participantEntries.length - 1) {
        const remainingToMatch = pricing.to_pay - runningNetSum;
        net = remainingToMatch;
      } else {
        runningNetSum += net;
      }

      
      const upiLink = 'upi://pay?pa=' + params.hostUpiVpa || 'swiggy@upi' + '&pn=SwiggyHost' + '&am=' + net + '&cu=INR';
      splits.push({
        participantId: id,
        participantName: data.name,
        itemSubtotal: data.subtotal,
        items: data.items,
        shareOfTaxesAndFees: shareOfCharges,
        shareOfDiscount,
        netPayable: net,
        paymentStatus: 'PENDING',
        upiDeepLink: upiLink
      });
    });

    let summary = '### Swiggy Group Order Bill Split: ' + restaurantName + '\n\n';
    summary += '**Total to Pay:** INR ' + pricing.to_pay + ' (Items: INR ' + pricing.item_total + ' | Fees: INR ' + extraCharges + ' | Discount: -INR ' + totalDiscount + ')\n\n';
    summary += '| Participant | Dishes | Subtotal | Net Split | UPI Quick-Pay |\n';
    summary += '| :--- | :--- | :--- | :--- | :--- |\n';

    for (const s of splits) {
      const dishes = s.items.map((it) => it.quantity + 'x ' + it.name).join(', ');
      summary += '| **' + s.participantName + '** | ' + dishes + ' | INR ' + s.itemSubtotal + ' | **INR ' + s.netPayable + '** | [Pay via UPI](' + s.upiDeepLink + ') |\n';
    }

    return {
      cartId: cartData.cart_id,
      restaurantName,
      overallTotal: pricing.to_pay,
      itemTotal: pricing.item_total,
      deliveryCharge: pricing.delivery_charge,
      taxesAndCharges: pricing.taxes_and_charges,
      couponDiscount: totalDiscount,
      couponCode: cartData.offers?.coupon_applied || undefined,
      splits,
      formattedSummary: summary
    };
  }
}
