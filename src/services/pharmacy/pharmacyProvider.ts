import { Pharmacy } from '../../types/pharmacy';

export interface PharmacyDataProvider {
  getPharmacies(): Promise<Pharmacy[]>;
  getPharmacyById(id: string): Promise<Pharmacy | null>;
}
