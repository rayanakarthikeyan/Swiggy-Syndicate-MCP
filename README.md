# Swiggy Syndicate

An Autonomous Group Order & Meeting Concierge Model Context Protocol (MCP) Server.

Swiggy Syndicate coordinates multi-party food ordering workflows on top of Swiggy Food MCP API. It addresses collective decision-making friction, dietary constraints, delivery SLAs, cart SKU consolidation, and itemized bill splitting with UPI reimbursement links.

---

## Problem Statement

Group food ordering for teams, meetings, and social gatherings is historically prone to high checkout abandonment and logistical delays due to several distinct factors:

1. **Dietary and Preference Conflicts**: Accommodating varied requirements (Vegetarian, Non-Vegetarian, Vegan, Jain, High-Protein) across 5 to 15 attendees often leads to prolonged deliberations and cross-contamination concerns.
2. **Budget and SLA Constraints**: Aligning on an agreed per-person budget while ensuring the chosen restaurant fulfills delivery timeframe SLAs (Service Level Agreements) requires manual menu exploration.
3. **Manual Cart Construction**: Compiling individual orders into a single coherent basket requires manual entry, customization handling, and inventory verification.
4. **Post-Order Financial Reconciliation**: Calculating individual liability post-checkout is complicated by proportional taxes (GST/FSSAI), delivery charges, packaging fees, and discounts, leading to awkward financial follow-ups.

---

## Solution Overview

Swiggy Syndicate provides an autonomous multi-agent solution implementing the Model Context Protocol standard defined by Swiggy Builders Club (https://mcp.swiggy.com/builders).

### Core Capabilities

- **Multi-Party Constraint Solver**: Evaluates individual participant constraints (dietary restrictions, per-person budget caps, dish cravings) against active restaurants, ratings, and delivery SLAsr�- **SKU Optimization & Consolidation**: Maps cravings to dishes with a focus on Swiggy Bestsellers and high-rated catalog items, consolidating quantities for Swiggy Food MCP tool ingestion.
- **Authoritative API Adherence**: Built strictly against the Swiggy Food MCP schemas for `search_restaurants`, `get_restaurant_menu` (enforcing the 150-item limit), and `update_food_cart`.
- **Penny-Reconciled Bill Splitter**: Proportional allocation of overheads (delivery, taxes, platform charges, and discounts) across all participants, ensuring the mathematical sum of individual splits exactly matches the payable total (`cart.pricing.to_pay`).
- **Direct Payment Deep-Links**: Produces standardized NPCI-compliant `upi://pay` links for friction-free individual reimbursement.
- **Dual-Mode Operational Engine**: Works with live OAuth 2.1 PKCE bearer tokens against `mcp.swiggy.com` while maintaining a local sandbox fallback with authentic Bengaluru restaurant menus for automated testing and CI verification.

---

## Architecture

```
  +KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJP��Y[�
�]YH\�����\��܈��[��\��H�
�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJ�[����ӋT�
�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK]�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJ��Y��H�[�X�]HP��\��\���K�[��[���[Z^�W�ܛ�\�YX[���^X�]W�ܛ�\��\��[���]�
�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJ�
�KKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKJ��]�H��Y��HP�H���[�[����[�X��B�
�]]��H��JH
Y�Q�Y[]HY[�\�B��X����Y��K���Kٛ��YY�[�H�����Y��\��KKB�������^��Y�����[��[���[Z^�W�ܛ�\�YX[�]�[X]\�X[HY[X�\�[�]�Y]\�H�ٚ[\�[��H\��]��Y[�Y�HH�[X[�\�]\�[�[�Y[�H][H[��][ۜ˂����[�]\�[Y]\�Ί���H�\�]X
��[��N�X�[܈YY][��\�ܚ\[ۋ��HY�\��Y
��[��N��\�Y�YY��Y��H[]�\�HY�\��Q��H\��][]�\�SZ[�]\�
�[X�\��[ۘ[
N�X^[][HX��\X�H[]�\�H�K��Hݙ\�[�Y�]
�[X�\��[ۘ[
N�Y�ܙY�]H�Y�][Z][�S����H�Y�\��Y�ܙY��۝
��[���[ۘ[
N���Y��H�ܙY��۝�[\�
PU�Q����ԑW�NX
K��H\�X�\[��
\��^JN�\��^Hو][�YHؚ�X���X�Y�Z[��Y�[YXY]
S�X�Q��ӗՑQ��Q�S��RS�Q����RS�
KX^�Y�][��[ۘ[�X�Y�X�\�������^X�]W�ܛ�\��\��[���]��ۜ��X��H�ۜ��Y]Y�\�^[�Y[����\���Y��H���P�\]Wٛ����\���\]\�^X���ܝ[ۘ[�]�[��[�\�]\�TH^[Y[�T�˂����[�]\�[Y]\�Ί���HY�\��Y
��[��N�\�[�][ۈY�\��Y[�Y�Y\���H�\�]\�[�Y
��[��N��[X�Y�\�]\�[�Y[�Y�Y\���H�\�]\�[��[YX
��[��N��[X�Y�\�]\�[�\�^H�[YK��H\��YۙY][\�
\��^JN�\��^Hو[��]Y][\��]\�X�\[�\����X][ۜ˂�H��\U�X
��[���[ۘ[
N�TH�HوH^Z[�����܈[���[��Z[X�\��[Y[����KKB�����][���\�Y������\�\]Z\�]\H��K���
�\��[ۈN܈Y�\�B�H�H
�\��[ۈH܈Y�\�B�����[��[][ۂ���\���]�ۙH΋���]X����Kܘ^X[�Z�\�Z�^X[����Y��K\�[�X�]K��]����Y��K\�[�X�]B��H[��[��H�[��Z[�������[��[��H\��Z]B���\���H\��������[��[��H[�\�X�]�H�[][][ۂ���\���H�[�[[��KKB�����Y[�[�Yܘ][ۂ����Y�\�\�\�P��\��\��]�]YH\����\��܋܈�[��\��YH����[���ۙ�Y�\�][ۈ�[�\�X��\��\���ۙ�Y�\�][ۈ���΂����ۂ��X��\��\�Ȏ����Y��K\�[�X�]H�����[X[������H���\��Ȏ�ȋ�X���]K�]�����Y��K\�[�X�]K�\��[�^��ȗK��[�������Q��W���S�����SӐS�U�W��UU���S����B�B�B�B���Y���Q��W���S�\��Z]YH�\��\��\�]\�[��[����[][][ۈ[�K���KKB����X�[��B��RUX�[��K���\�Y�
�H����^X[�Z�\�Z�^X[��