import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatCOP } from "@/lib/cart-context";
import { ordersApi, type Order } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Minus, Plus, Package, ShoppingBag, Download, ArrowRight } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const checkout = async () => {
    if (!user || items.length === 0) return;
    setPaying(true);
    try {
      const order = await ordersApi.create();
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

  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

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
            <Button asChild><Link to="/productos">Ver productos</Link></Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((i) => (
                <Card key={i.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Imagen */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-muted overflow-hidden shrink-0">
                      {i.productImageUrl ? (
                        <img src={resolveImageUrl(i.productImageUrl)} alt={i.productName} className="w-full h-full object-cover" />
                      ) : <Package className="w-full h-full p-4 text-muted-foreground" />}
                    </div>
                    {/* Info + controles */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="font-medium line-clamp-2 text-sm sm:text-base leading-tight">{i.productName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">SKU {i.productSku}</div>
                        <div className="font-bold mt-1 text-sm sm:text-base">{formatCOP(Number(i.productPrice))}</div>
                      </div>
                      {/* Controles de cantidad y eliminar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQty(i.id, i.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-7 sm:w-8 text-center font-medium text-sm">{i.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8"
                            disabled={i.quantity >= i.productStock}
                            onClick={() => updateQty(i.id, i.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button size="icon" variant="ghost" className="ml-auto h-7 w-7 sm:h-9 sm:w-9" onClick={() => removeItem(i.id)}>
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 sm:p-6 h-fit shadow-card lg:sticky lg:top-24">
              <h2 className="font-bold mb-4">Resumen</h2>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Productos</span>
                <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t pt-3 mt-3">
                <span>Total</span>
                <span>{formatCOP(total)}</span>
              </div>
              <Button className="w-full mt-5 sm:mt-6" size="lg" onClick={checkout} disabled={paying}>
                {paying ? "Procesando..." : "Confirmar pedido"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                El pedido quedará en estado pendiente para aprobación.
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Diálogo de descarga del pedido */}
      <Dialog open={!!confirmedOrder} onOpenChange={(open) => { if (!open) handleSkipDownload(); }}>
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
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleSkipDownload}>
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
