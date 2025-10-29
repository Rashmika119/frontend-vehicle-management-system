import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {

    private socket!: Socket;
    private jobNotificationSource = new BehaviorSubject<any>(null);
    jobNotification$ = this.jobNotificationSource.asObservable();

    constructor() {
        this.socket = io('http://localhost:3002', {
            transports: ['websocket'],
            reconnection: true
        });
        this.socket.on('connect', () => {
            console.log('Socket connected successfully, ID:', this.socket.id);
        });

        this.socket.on('registered', (data: any) => {
            console.log('Registration confirmed:', data);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('jobCompleted', (data: any) => {
            console.log('Job completed notification received:', data);
            this.jobNotificationSource.next(data);
        });

        this.socket.on('error', (error: any) => {
            console.error('Socket error:', error);
        });
    }

    connectClient(clientName: string) {
        if (!clientName) return;

        if (this.socket.connected) {
            this.socket.emit('registerClient', clientName);
            console.log('Client registered:', clientName);
        } else {
            console.log('Socket not connected yet, waiting...');
            this.socket.on('connect', () => {
                this.socket.emit('registerClient', clientName);
                console.log('Client registered after connection:', clientName);
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    registerNow() {
  const clientName = localStorage.getItem('clientName');
  if (clientName) {
    this.socket.emit('registerClient', clientName);
    console.log('Client force-registered:', clientName);
  }
}
}
