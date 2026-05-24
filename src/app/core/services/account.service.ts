import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AccountSummary, Transaction } from '../models/transaction.model';
import { MOCK_ACCOUNT, MOCK_TRANSACTIONS } from '../../mocks/account.mock';

@Injectable({ providedIn: 'root' })
export class AccountService {
  readonly account = signal<AccountSummary>(MOCK_ACCOUNT);
  readonly transactions = signal<Transaction[]>(MOCK_TRANSACTIONS);

  getAccount(): Observable<AccountSummary> {
    return of(MOCK_ACCOUNT).pipe(delay(300));
  }

  getRecentTransactions(): Observable<Transaction[]> {
    return of(MOCK_TRANSACTIONS).pipe(delay(450));
  }
}
