import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { SwiggyMcpClient } from "../client/swiggy-mcp-client";
import { GroupConstraintOptimizer } from "../engine/constraint-optimizer";
import { GroupBillSplitter } from "../engine/bill-splitter";
import { GroupOrderRequirements } from "../types/group";

export class SwiggySyndicateServer {
  private server: Server;
  private client: SwiggyMcpClient;
  private optimizer: GroupConstraintOptimizer;

  constructor() {
    this.server = new Server(
      {
        name: "swiggy-syndicate-mcp",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.client = new SwiggyMcpClient();
    this.optimizer = new GroupConstraintOptimizer(this.client);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "plan_and_optimize_group_meal",
          description:
            "Autonomous multi-person food order optimizer. Takes participants dietary constraints, individual budgets, delivery SLAs, and coordinates the best restaurant, balanced dishes, and cost calculation via Swiggy Food MCP.",
          inputSchema: {
            type: "object",
            properties: {
              orderTitle: { type: "string", description: "Title of the meal event" },
              addressId: { type: "string", description: "Saved Swiggy delivery addressId" },
              targetDeliveryMinutes: { type: "number", description: "Max acceptable delivery time in minutes" },
              overallBudget: { type: "number", description: "Overall budget cap for the entire group in INR" },
              preferredStorefront: {
                type: "string",
                enum: ["EATRIGHT", "BOLT", "STORE_99"],
                description: "Swiggy collection storefront filter"
              },
              participants: {
                type: "array",
                description: "List of people with their dietary requirements and budget",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    diet: {
                      type: "string",
                      enum: ["ANY", "VEG", "NON_VEG", "VEGAN", "JAIN", "HIGH_PROTEIN"]
                    },
                    maxBudget: { type: "number" },
                    specificDish: { type: "string" }
                  },
                  required: ["id", "name", "diet"]
                }
              }
            },
            required: ["orderTitle", "addressId", "participants"]
          }
        },
        {
          name: "execute_group_cart_and_split",
          description:
            "Finalizes the group order on Swiggy Food by calling update_food_cart, calculates proportional tax/fees split per attendee, and generates ready-to-pay UPI payment links.",
          inputSchema: {
            type: "object",
            properties: {
              addressId: { type: "string", description: "Address ID from get_addresses" },
              restaurantId: { type: "string", description: "Selected Swiggy restaurant ID" },
              restaurantName: { type: "string", description: "Name of the restaurant" },
              assignedItems: {
                type: "array",
                description: "Optimized items assigned to each participant",
                items: {
                  type: "object",
                  properties: {
                    participantId: { type: "string" },
                    participantName: { type: "string" },
                    menuItemId: { type: "string" },
                    itemName: { type: "string" },
                    price: { type: "number" },
                    quantity: { type: "number" }
                  },
                  required: ["participantId", "participantName", "menuItemId", "itemName", "price", "quantity"]
                }
              },
              hostUpiUpa: { type: "string", description: "Host UPI VPA for bill reimbursement" }
            },
            required: ["addressId", "restaurantId", "assignedItems"]
          }
        }
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === "plan_and_optimize_group_meal") {
          const req = args as unknown as GroupOrderRequirements;
          const plan = await this.optimizer.optimizeGroupOrder(req);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    data: plan,
                    summary: `Optimized order for ${req.participants.length} attendees at ${plan.restaurantName}. Est. total: ₮${plan.estimatedToPay} (~ ⊮${plan.perPersonAverage}/person).`
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        if (name === "execute_group_cart_and_split") {
          const { addressId, restaurantId, restaurantName, assignedItems, hostUpiVpa } = args as any;

          const cartItemMap: Record<string, number> = {};
          for (const item of assignedItems) {
            cartItemMap[item.menuItemId] = (cartItemMap[item.menuItemId] || 0) + item.quantity;
          }

          const cartItemsPayload = Object.entries(cartItemMap).map(([menu_item_id, quantity]) => ({
            menu_item_id,
            quantity
          }));

          const cartRes = await this.client.updateFoodCart({
            addressId,
            restaurantId,
            restaurantName,
            cartItems: cartItemsPayload
          });

          if (!cartRes.success || !cartRes.data?.data) {
            throw new Error(cartRes.error?.message || "Failed to update Swiggy cart");
          }

          const billSplit = GroupBillSplitter.computeSplit({
            cartData: cartRes.data.data,
            assignedItems,
            hostUpiVpa
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    data: {
                      cart: cartRes.data.data,
                      billSplit
                    },
                    markdownDisplay: billSplit.formattedSummary
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: {message: err.message || "Execution failure"}
              })
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("swiggy Syndicate MCP Server running on stdio");
  }
}