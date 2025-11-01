import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import { provideApollo } from 'apollo-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideApollo(() => {
      return new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({ uri: 'http://localhost:3001/graphql' }),
      });
    }),
  ],
};
