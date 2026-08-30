import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GoodsReceivingDashboard from "./goods-receiving/GoodsReceivingDashboard";
import GoodsReceivingView from "./goods-receiving/GoodsReceivingView";
import GoodsReceivingForm from "./goods-receiving/GoodsReceivingForm";
import GoodsReceivingEdit from "./goods-receiving/GoodsReceivingEdit";
import GoodsReceivingResolution from "./goods-receiving/GoodsReceivingResolution";
import type {
  ResolutionIssueType,
  ScreenMode,
} from "./goods-receiving/goodsReceiving.types";
import { REDS } from "./goods-receiving/goodsReceiving.constants";

export default function GoodsReceiving() {
  const [screen, setScreen] = useState<ScreenMode>("dashboard");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [resolutionReceiptItemId, setResolutionReceiptItemId] = useState<
    string | undefined
  >(undefined);
  const [resolutionIssueType, setResolutionIssueType] = useState<
    ResolutionIssueType | undefined
  >(undefined);

  const { data: canView, isLoading } = useQuery({
    queryKey: ["goods-receiving-module-view-permission"],
    queryFn: async () => {
      const [supplierView, siteView, siteReceive] = await Promise.all([
        (supabase as any).rpc("has_permission", {
          p_permission_code: "supplier_deliveries.view",
        }),
        (supabase as any).rpc("has_permission", {
          p_permission_code: "site_goods_receiving.view",
        }),
        (supabase as any).rpc("has_permission", {
          p_permission_code: "site_goods_receiving.receive",
        }),
      ]);

      return Boolean(
        (!supplierView.error && supplierView.data === true) ||
        (!siteView.error && siteView.data === true) ||
        (!siteReceive.error && siteReceive.data === true),
      );
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: REDS }} />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          You do not have permission to view Goods Receiving.
        </div>
      </div>
    );
  }

  const dashboard = () => {
    setDeliveryId(null);
    setResolutionReceiptItemId(undefined);
    setResolutionIssueType(undefined);
    setScreen("dashboard");
  };

  const openView = (id: string) => {
    setDeliveryId(id);
    setResolutionReceiptItemId(undefined);
    setResolutionIssueType(undefined);
    setScreen("view");
  };

  const openEdit = (id: string) => {
    setDeliveryId(id);
    setResolutionReceiptItemId(undefined);
    setResolutionIssueType(undefined);
    setScreen("edit");
  };

  const openResolution = (
    id: string,
    receiptItemId?: string,
    issueType?: ResolutionIssueType,
  ) => {
    setDeliveryId(id);
    setResolutionReceiptItemId(receiptItemId);
    setResolutionIssueType(issueType);
    setScreen("resolution");
  };

  if (screen === "view" && deliveryId) {
    return (
      <GoodsReceivingView
        deliveryId={deliveryId}
        onBack={dashboard}
        onEdit={openEdit}
      />
    );
  }

  if (screen === "edit" && deliveryId) {
    return (
      <GoodsReceivingEdit
        deliveryId={deliveryId}
        onBack={dashboard}
        onSaved={openView}
        onResolve={openResolution}
      />
    );
  }

  if (screen === "resolution" && deliveryId) {
    return (
      <GoodsReceivingResolution
        deliveryId={deliveryId}
        receiptItemId={resolutionReceiptItemId}
        issueType={resolutionIssueType}
        onBack={() => openEdit(deliveryId)}
        onCompleted={openEdit}
      />
    );
  }

  if (screen === "receive") {
    return <GoodsReceivingForm onBack={dashboard} onCompleted={openView} />;
  }

  return (
    <GoodsReceivingDashboard
      onView={openView}
      onEdit={openEdit}
      onReceive={() => {
        setResolutionReceiptItemId(undefined);
        setResolutionIssueType(undefined);
        setScreen("receive");
      }}
    />
  );
}
