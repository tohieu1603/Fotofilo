/**
 * Shipping Address Value Object
 * Encapsulates shipping address details with validation
 */
export class ShippingAddress {
  constructor(
    private readonly receiverName: string,
    private readonly receiverPhone: string,
    private readonly street: string,
    private readonly city: string,
    private readonly district: string,
    private readonly ward: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.receiverName || this.receiverName.trim().length === 0) {
      throw new Error('Receiver name cannot be empty');
    }

    if (!this.receiverPhone || this.receiverPhone.trim().length === 0) {
      throw new Error('Receiver phone cannot be empty');
    }

    // Basic Vietnamese phone number validation
    const phoneRegex = /^(\+84|84|0)[35789]\d{8}$/;
    if (!phoneRegex.test(this.receiverPhone.replace(/\s/g, ''))) {
      throw new Error('Invalid Vietnamese phone number format');
    }

    if (!this.street || this.street.trim().length === 0) {
      throw new Error('Street address cannot be empty');
    }

    if (!this.city || this.city.trim().length === 0) {
      throw new Error('City cannot be empty');
    }

    if (!this.district || this.district.trim().length === 0) {
      throw new Error('District cannot be empty');
    }

    if (!this.ward || this.ward.trim().length === 0) {
      throw new Error('Ward cannot be empty');
    }
  }

  getReceiverName(): string {
    return this.receiverName;
  }

  getReceiverPhone(): string {
    return this.receiverPhone;
  }

  getStreet(): string {
    return this.street;
  }

  getCity(): string {
    return this.city;
  }

  getDistrict(): string {
    return this.district;
  }

  getWard(): string {
    return this.ward;
  }

  getFullAddress(): string {
    return `${this.street}, ${this.ward}, ${this.district}, ${this.city}`;
  }

  equals(other: ShippingAddress): boolean {
    return (
      this.receiverName === other.receiverName &&
      this.receiverPhone === other.receiverPhone &&
      this.street === other.street &&
      this.city === other.city &&
      this.district === other.district &&
      this.ward === other.ward
    );
  }

  toString(): string {
    return `${this.receiverName} - ${this.receiverPhone}\n${this.getFullAddress()}`;
  }
}