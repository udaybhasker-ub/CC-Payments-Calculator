export interface Entry {
    name: string;
    limit: number;
    apr: number;
    balance: number;
    usage?: number;
    interestAmount?: number;
    interestRelPercent?: number;
    paymentPercent?: number;
    payment?: number;
    newBalance?: number;
    newInterest?: number;
    apply?:boolean;
  }
  