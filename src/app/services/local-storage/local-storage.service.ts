import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Entry } from 'src/app/types/Entry.type';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  _entries: BehaviorSubject<Entry[]> = new BehaviorSubject([] as Entry[]);

  constructor() { }

  get entries() {
    return this._entries.asObservable();
  }


  save(data: Entry) {
    let cards: Entry[] | null = this.get();
    if (cards) {
      const existing = cards.find(entry => entry.name === data.name);
      if (existing)
        return false;
    } else
      cards = [] as Entry[];

    cards.push(data);
    localStorage.setItem('Cards', JSON.stringify(cards));
    this._entries.next(cards);
    return true;
  }

  edit(data: Entry) {
    let cards: Entry[] | null = this.get();
    if (cards) {
      const index = cards.findIndex(entry => entry.name === data.name);
      if (index < 0)
        return false;

      cards[index] = data;
      localStorage.setItem('Cards', JSON.stringify(cards));
      this._entries.next(cards);
      return true;
    }
    return false;
  }

  delete(name: string) {
    let cards: Entry[] | null = this.get();
    if (cards) {
      cards = cards.filter(entry => entry.name !== name);
      localStorage.setItem('Cards', JSON.stringify(cards));
      this._entries.next(cards);
    }
  }

  clear() {
    localStorage.removeItem('Cards');
    this._entries.next([]);
  }

  get(): Entry[] {
    return this.getStorageItem<Entry[]>('Cards');
  }

  private getStorageItem<Type>(key: string): Type {
    let item: string | null = localStorage.getItem(key);
    return (item ? JSON.parse(item) : []) as Type;
  }
}
