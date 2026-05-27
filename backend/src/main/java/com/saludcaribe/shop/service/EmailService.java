package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.order.OrderResponse;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    private static final String BRAND_COLOR = "#2563eb";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final NumberFormat COP = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CO"));

    @Async
    public void sendOrderConfirmation(OrderResponse order) {
        if (fromAddress == null || fromAddress.isBlank()) {
            log.warn("MAIL_USERNAME no configurado — se omite el envío de email para pedido {}", order.getId());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, "SALUDCARIBE SHOP");
            helper.setTo(order.getUserEmail());
            helper.setSubject("Pedido #" + order.getId().toString().substring(0, 8).toUpperCase() + " recibido — SALUDCARIBE SHOP");
            helper.setText(buildOrderHtml(order), true);
            mailSender.send(message);
            log.info("Email de confirmación enviado a {}", order.getUserEmail());
        } catch (Exception e) {
            log.error("Error enviando email de confirmación al pedido {}: {}", order.getId(), e.getMessage(), e);
        }
    }

    private String buildOrderHtml(OrderResponse order) {
        String orderId = order.getId().toString().substring(0, 8).toUpperCase();
        String createdAt = order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FMT) : "-";

        StringBuilder rows = new StringBuilder();
        for (OrderResponse.OrderItemResponse item : order.getItems()) {
            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            rows.append("<tr>")
                .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;'>").append(esc(item.getProductName())).append("</td>")
                .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;'>").append(item.getQuantity()).append("</td>")
                .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;'>").append(COP.format(item.getUnitPrice())).append("</td>")
                .append("<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;'>").append(COP.format(subtotal)).append("</td>")
                .append("</tr>");
        }

        return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'></head><body style='margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;'>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6fb;padding:30px 0;'>"
            + "<tr><td align='center'>"
            + "<table width='600' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);'>"

            // Header
            + "<tr><td style='background:" + BRAND_COLOR + ";padding:24px 32px;'>"
            + "<h1 style='color:#fff;margin:0;font-size:22px;letter-spacing:.5px;'>SALUDCARIBE SHOP</h1>"
            + "<p style='color:#bfdbfe;margin:4px 0 0;font-size:13px;'>Sistema de Gestión de Insumos Médicos</p>"
            + "</td></tr>"

            // Body
            + "<tr><td style='padding:32px;'>"
            + "<h2 style='color:#1e293b;margin:0 0 8px;font-size:18px;'>¡Pedido recibido correctamente!</h2>"
            + "<p style='color:#475569;font-size:14px;margin:0 0 24px;'>Hola <strong>" + esc(order.getUserFullName()) + "</strong>, tu pedido ha sido registrado y está pendiente de aprobación.</p>"

            // Summary box
            + "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border-radius:8px;margin-bottom:24px;'>"
            + "<tr><td style='padding:16px 20px;'>"
            + "<table width='100%'>"
            + "<tr><td style='color:#64748b;font-size:13px;padding:3px 0;'>N° de pedido</td><td style='text-align:right;font-size:13px;font-weight:700;color:#1e293b;'>#" + orderId + "</td></tr>"
            + "<tr><td style='color:#64748b;font-size:13px;padding:3px 0;'>Fecha</td><td style='text-align:right;font-size:13px;color:#1e293b;'>" + createdAt + "</td></tr>"
            + "<tr><td style='color:#64748b;font-size:13px;padding:3px 0;'>Centro de costo</td><td style='text-align:right;font-size:13px;color:#1e293b;'>" + esc(order.getCostCenterName()) + "</td></tr>"
            + "<tr><td style='color:#64748b;font-size:13px;padding:3px 0;'>Dependencia</td><td style='text-align:right;font-size:13px;color:#1e293b;'>" + esc(order.getDependencyName()) + "</td></tr>"
            + "<tr><td style='color:#64748b;font-size:13px;padding:3px 0;'>Estado</td><td style='text-align:right;'><span style='background:#fef9c3;color:#854d0e;font-size:12px;font-weight:600;padding:2px 10px;border-radius:20px;'>PENDIENTE</span></td></tr>"
            + "</table></td></tr></table>"

            // Items table
            + "<h3 style='color:#1e293b;font-size:15px;margin:0 0 12px;'>Detalle del pedido</h3>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;font-size:13px;'>"
            + "<thead><tr style='background:" + BRAND_COLOR + ";color:#fff;'>"
            + "<th style='padding:9px 12px;text-align:left;font-weight:600;'>Producto</th>"
            + "<th style='padding:9px 12px;text-align:center;font-weight:600;'>Cant.</th>"
            + "<th style='padding:9px 12px;text-align:right;font-weight:600;'>Precio unit.</th>"
            + "<th style='padding:9px 12px;text-align:right;font-weight:600;'>Subtotal</th>"
            + "</tr></thead>"
            + "<tbody>" + rows + "</tbody>"
            + "<tfoot><tr style='background:#f1f5f9;'>"
            + "<td colspan='3' style='padding:10px 12px;text-align:right;font-weight:700;font-size:14px;color:#1e293b;'>TOTAL</td>"
            + "<td style='padding:10px 12px;text-align:right;font-weight:700;font-size:15px;color:" + BRAND_COLOR + ";'>" + COP.format(order.getTotal()) + "</td>"
            + "</tr></tfoot>"
            + "</table>"

            + (order.getNotes() != null && !order.getNotes().isBlank()
                ? "<p style='margin:18px 0 0;color:#64748b;font-size:13px;'><strong>Observaciones:</strong> " + esc(order.getNotes()) + "</p>"
                : "")

            + "<p style='margin:24px 0 0;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;'>Este es un mensaje automático. Por favor no respondas a este correo. Si tienes dudas comunícate con el área de almacén.</p>"
            + "</td></tr>"

            // Footer
            + "<tr><td style='background:#f8fafc;padding:16px 32px;text-align:center;'>"
            + "<p style='color:#94a3b8;font-size:12px;margin:0;'>© " + java.time.Year.now().getValue() + " SALUDCARIBE SHOP — Sistema de Gestión de Insumos Médicos</p>"
            + "</td></tr>"

            + "</table></td></tr></table></body></html>";
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
