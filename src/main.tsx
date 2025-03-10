import React from 'react';
import ReactDom from 'react-dom';
import type { FC, ReactHTMLElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as ReactRedux from 'react-redux';
import * as ReduxToolkit from '@reduxjs/toolkit';
import AppRoutes from '@/app/AppRoutes';
import { makeStore } from '@/app/store';
import { Theme } from '@radix-ui/themes';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import type { AppConfiguration } from '@/features/configuration/configurationSlice';
import twigToJSXComponentMap from '@/components/form/twig-to-jsx-component-map';
import hyperscriptify from '@/local_packages/hyperscriptify';
import propsify from '@/local_packages/hyperscriptify/propsify/standard';
import type { EnhancedStore } from '@reduxjs/toolkit';
import transforms from '@/utils/transforms';

import '@/styles/radix-themes';
import '@/styles/index.css';
import { AJAX_UPDATE_FORM_STATE_EVENT } from '@/types/Ajax';

declare global {
  interface Window {
    React: typeof React;
    ReactDom: typeof ReactDom;
    Redux: typeof ReactRedux;
    ReduxToolkit: typeof ReduxToolkit;
  }
}

// Provide these dependencies as globals so extensions do not have redundant and
// potentially conflicting dependencies.
window.React = React;
window.ReactDom = ReactDom;
window.Redux = ReactRedux;
window.ReduxToolkit = ReduxToolkit;

interface ProviderComponentProps {
  store: EnhancedStore;
}

const { drupalSettings } = window;
const { Drupal } = window as any;

const container = document.getElementById('experience-builder');

const appConfiguration: AppConfiguration = {
  baseUrl: drupalSettings?.path?.baseUrl || import.meta.env.BASE_URL,
  entityType: drupalSettings?.xb?.entityType || 'node',
  entity: drupalSettings?.xb?.entity || '1',
};

if (container) {
  const root = createRoot(container);
  let routerRoot = appConfiguration.baseUrl;
  if (drupalSettings?.xb?.base) {
    routerRoot = `${routerRoot}${drupalSettings.xb.base}`;
  }
  const store = makeStore({ configuration: appConfiguration });

  // Make the store available to extensions.
  (drupalSettings as any).xb.store = store;

  root.render(
    <React.StrictMode>
      <Theme
        accentColor="blue"
        hasBackground={false}
        panelBackground="solid"
        appearance="light"
      >
        <ErrorBoundary variant="page">
          <Provider store={store}>
            <AppRoutes basePath={routerRoot} />
          </Provider>
        </ErrorBoundary>
      </Theme>
    </React.StrictMode>,
  );

  // Make the list of twig-to-JSX components available to Drupal behaviors.
  Drupal.JSXComponents = twigToJSXComponentMap;

  Drupal.xbTransforms = transforms;

  // Make this application's hyperscriptify functionality available to
  // Drupal behaviors.
  Drupal.Hyperscriptify = (context: HTMLElement) => {
    return hyperscriptify(
      context,
      React.createElement,
      React.Fragment,
      twigToJSXComponentMap,
      { propsify },
    );
  };

  // Provide Drupal behaviors this method for hyperscriptifying content added
  // via the Drupal AJAX API.
  Drupal.HyperscriptifyAdditional = (
    Application: ReactHTMLElement<any>,
    context: HTMLElement,
  ) => {
    const container = document.createElement('div');
    context.after(container);
    const root = createRoot(container);

    // Wrap the newly rendered content in the Redux provider so it has access
    // to the existing store.
    root.render(
      React.createElement<ProviderComponentProps>(
        Provider as FC,
        { store },
        Application as ReactHTMLElement<any>,
      ),
    );
    return container;
  };

  /**
   * A global function that can be called to notify the application that inputs
   * have been changed via an AJAX response.
   *
   * @param {HTMLElement[]} updatedInputs - The updated elements
   */
  Drupal.HyperscriptifyUpdateStore = (updatedInputs: Array<HTMLElement>) => {
    let formId: string | null = null;
    const updates = updatedInputs
      .map((el) => {
        // For each element, parse out its attributes. These are JSON sent by
        // the xb_stark.theme with the semi_coupled theme engine.
        return JSON.parse(el.getAttribute('attributes') || '{}');
      })
      // Build a key-value pair of input names and values.
      .reduce((carry, attributes) => {
        if (
          // Collect inputs that have all the 'name', 'value', 'data-ajax' and
          // 'data-form-id' attributes set.
          'name' in attributes &&
          'value' in attributes &&
          'data-ajax' in attributes &&
          'data-form-id' in attributes
        ) {
          if (formId === null) {
            // This is the first element so let's make note of the form that
            // triggered the AJAX event.
            formId = attributes['data-form-id'];
          }
          return {
            // Push this element's name and value into the key value pair.
            ...carry,
            [attributes.name]: attributes.value,
          };
        }
        return carry;
      }, {});
    if (Object.values(updates).length > 0) {
      // At least one input name and value pair exists, so fire a custom event
      // so that any component in the tree can react to the ajax update.
      // @todo Consider interacting directly with the store https://www.drupal.org/i/3505039
      const event = new CustomEvent(AJAX_UPDATE_FORM_STATE_EVENT, {
        detail: { updates, formId },
      });
      document.dispatchEvent(event);
    }
  };
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}
