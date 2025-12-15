import { Buffer } from 'buffer'
window.Buffer = Buffer

import React from "react";
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { store } from './redux/store';

import App from './App';
import BaseLayout from './components/layout/BaseLayout/BaseLayout';
import Home from './pages/Home';
import About from './pages/About';
import ContactUs from './pages/ContactUs';
import Downloads from './pages/Downloads';
import GenomeBrowser from './pages/GenomeBrowser';
import Explore from './pages/Explore';
import Gene from './pages/Gene';

const router = createBrowserRouter([
  {
    path: "/about",
    element: (
      <BaseLayout>
        <About />
      </BaseLayout>
    ),
  },
  {
    path: "/contact",
    element: (
      <BaseLayout>
        <ContactUs />
      </BaseLayout>
    ),
  },
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: ":organism?/:assembly?/:source?/:version?/:nomenclature?",
        children: [
          { path: "", element: <Home /> },
          { path: "downloads", element: <Downloads /> },
          { path: "browser/:locus?", element: <GenomeBrowser /> },
          { path: "explore", element: <Explore /> },
          { path: "gene/:gid", element: <Gene /> },
          { path: "about", element: <About /> },
          { path: "contact", element: <ContactUs /> },
        ]
      },
    ]
  },
  // Catch-all route - redirect any unmatched paths to the root app
  {
    path: "/*",
    element: <App />,
  },
], { 
  basename: import.meta.env.BASE_URL,
},
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);