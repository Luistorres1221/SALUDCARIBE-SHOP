import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatCOP } from "@/lib/cart-context";
import { ordersApi, type Order } from "@/api/orders";
import { costCentersApi, type CostCenter } from "@/api/costCenters";
import { dependenciesApi, type Dependency } from "@/api/dependencies";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Minus, Plus, Package, ShoppingBag, Download, ArrowRight, Building2, Layers } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { downloadOrderPdf } from "@/lib/order-pdf";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/carrito")({
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { items, total, updateQty, removeItem, clear } = useCart();

  const [paying, setPaying] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [selectedDependency, setSelectedDependency] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    costCentersApi.listActive().then(setCostCenters).catch(() => {});
    dependenciesApi.listActive().then(setDependencies).catch(() => {});
  }, [user]);

  const canCheckout =
    items.length > 0 && selectedCostCenter !== "" && selectedDependency !== "";

  const checkout = async () => {
    if (!user || !canCheckout) return;
    setPaying(true);
    try {
      const order = await ordersApi.create(selectedCostCenter, selectedDependency);
      await clear();
      setConfirmedOrder(order);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error creando pedido");
    } finally {
      setPaying(false);
    }
  };

  const handleDownload = () => {
    if (!confirmedOrder) return;
    downloadOrderPdf(confirmedOrder);
    navigate({ to: "/pedidos/$orderId", params: { orderId: confirmedOrder.id } });
    setConfirmedOrder(null);
  };

  const handleSkipDownload = () => {
    if (!confirmedOrder) return;
    navigate({ to: "/pedidos/$orderId", params: { orderId: confirmedOrder.id } });
    setConfirmedOrder(null);
  };

  if (loading || !user)
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> Tu carrito
        </h1>

        {items.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <Package className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
            <Button asChild>
              <Link to="/productos">Ver productos</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((i) => (
                <Card key={i.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-muted overflow-hidden shrink-0">
                      {i.productImageUrl ? (
                        <img
                          src={resolveImageUrl(i.productImageUrl)}
                          alt={i.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-full h-full p-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="font-medium line-clamp-2 text-sm sm:text-base leading-tight">
                          {i.productName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          SKU {i.productSku}
                        </div>
                        <div className="font-bold mt-1 text-sm sm:text-base">
                          {formatCOP(Number(i.productPrice))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => updateQty(i.id, i.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-7 sm:w-8 text-center font-medium text-sm">
                            {i.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            disabled={i.quantity >= i.productStock}
                            onClick={() => updateQty(i.id, i.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="ml-auto h-7 w-7 sm:h-9 sm:w-9"
                          onClick={() => removeItem(i.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Panel de resumen + selects */}
            <Card className="p-4 sm:p-6 h-fit shadow-card lg:sticky lg:top-24 space-y-4">
              <h2 className="font-bold">Resumen</h2>

              {/* Centro de costo */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Building2 className="w-4 h-4" />
                  Centro de costo <span className="text-destructive">*</span>
                </Label>
                {costCenters.length === 0 ? (
                  <p className="text-xs text-muted-foreground border rounded-md px-3 py-2">
                    No hay centros de costo disponibles
                  </p>
                ) : (
                  <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona uno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.code} — {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Dependencia */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Layers className="w-4 h-4" />
                  Dependencia <span className="text-destructive">*</span>
                </Label>
                {dependencies.length === 0 ? (
                  <p className="text-xs text-muted-foreground border rounded-md px-3 py-2">
                    No hay dependencias disponibles
                  </p>
                ) : (
                  <Select value={selectedDependency} onValueChange={setSelectedDependency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dependencies.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.code} — {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Productos</span>
                  <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={checkout}
                disabled={paying || !canCheckout}
              >
                {paying ? "Procesando..." : "Confirmar pedido"}
              </Button>

              {(!selectedCostCenter || !selectedDependency) && items.length > 0 && (
                <p className="text-xs text-destructive text-center">
                  Debes seleccionar el centro de costo y la dependencia para continuar.
                </p>
              )}

              {canCheckout && (
                <p className="text-xs text-muted-foreground text-center">
                  El pedido quedará en estado pendiente para aprobación.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Diálogo de confirmación / descarga PDF */}
      <Dialog
        open={!!confirmedOrder}
        onOpenChange={(open) => {
          if (!open) handleSkipDownload();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              ¡Pedido creado exitosamente!
            </DialogTitle>
            <DialogDescription className="pt-1">
              Tu pedido ha sido registrado y está pendiente de aprobación.
              <br />
              ¿Deseas descargar el resumen en PDF?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleSkipDownload}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              No, ver pedido
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Sí, descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
