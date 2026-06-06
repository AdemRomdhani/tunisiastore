const axios = require('axios');
const { GOVERNORATE_SHIPPING_DAYS } = require('../constants/governorates');

class ShippingService {
  constructor() {
    this.carriers = {
      poste: {
        name: 'Tunisia Post',
        apiUrl: 'https://www.poste.tn/essentials/ws/shipment',
        trackingUrl: 'https://www.poste.tn/essentials/tracking',
        supportTunisia: true
      },
      amena: {
        name: 'Amena',
        apiUrl: 'https://api.amena.tn/v1',
        trackingUrl: 'https://www.amena.tn/track',
        supportTunisia: true
      },
      aramex: {
        name: 'Aramex',
        apiUrl: 'https://ws.aramex.net/ShippingAPI.V2/',
        trackingUrl: 'https://www.aramex.com/track',
        supportTunisia: true
      }
    };
  }

  async createShipment(order, carrier = 'poste') {
    const carrierConfig = this.carriers[carrier];
    if (!carrierConfig) {
      throw new Error('Invalid carrier');
    }

    const shipmentData = {
      orderNumber: order.orderNumber,
      recipient: {
        name: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        address: {
          governorate: order.shippingAddress.governorate,
          city: order.shippingAddress.city,
          street: order.shippingAddress.streetAddress,
          postalCode: order.shippingAddress.postalCode
        }
      },
      packages: this.calculatePackages(order.items),
      service: 'STANDARD'
    };

    // In production, you would call the actual carrier API
    // For demo, we'll generate a tracking number
    const trackingNumber = this.generateTrackingNumber(carrier);

    return {
      carrier,
      carrierName: carrierConfig.name,
      trackingNumber,
      trackingUrl: `${carrierConfig.trackingUrl}/${trackingNumber}`,
      estimatedDelivery: this.calculateDeliveryDate(carrier, order.shippingAddress.governorate),
      cost: this.calculateShippingCost(carrier, order.shippingAddress.governorate)
    };
  }

  async trackShipment(trackingNumber, carrier = 'poste') {
    // In production, call carrier's tracking API
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      statusText: 'En cours de livraison',
      events: [
        {
          date: new Date(),
          location: 'Tunis',
          description: 'Colis en cours de livraison'
        }
      ]
    };
  }

  calculateShippingCost(carrier, governorate) {
    return 7;
  }

  calculateDeliveryDate(carrier, governorate) {
    const baseDays = {
      poste: 5,
      amena: 3,
      aramex: 2
    };

    const days = (baseDays[carrier] || 3) + (GOVERNORATE_SHIPPING_DAYS[governorate] || 3);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  calculatePackages(items) {
    let totalWeight = 0;
    const packages = [];

    for (const item of items) {
      const weight = (item.product?.inventory?.weight || 500) * item.quantity;
      totalWeight += weight;
    }

    // Group into packages (max 5kg per package)
    const maxWeight = 5000;
    let packageCount = Math.ceil(totalWeight / maxWeight);

    if (packageCount === 0) packageCount = 1;

    for (let i = 0; i < packageCount; i++) {
      packages.push({
        weight: Math.round(totalWeight / packageCount),
        dimensions: { length: 30, width: 20, height: 15 }
      });
    }

    return packages;
  }

  generateTrackingNumber(carrier) {
    const prefixes = {
      poste: 'TN',
      amena: 'AM',
      aramex: 'AR'
    };
    const prefix = prefixes[carrier] || 'TN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  getAvailableCarriers() {
    return Object.entries(this.carriers).map(([key, value]) => ({
      id: key,
      name: value.name,
      logo: `/assets/carriers/${key}.png`,
      supportTunisia: value.supportTunisia
    }));
  }
}

module.exports = new ShippingService();