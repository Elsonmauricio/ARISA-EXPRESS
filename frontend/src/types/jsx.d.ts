declare module '*.jsx' {
  const component: any
  export default component
}

declare module '*.js' {
  const value: any
  export default value
}

declare module '*.jsx' {
  const component: any
  export default component
}

declare module '*.jsx?react' {
  const component: any
  export default component
}

declare module './components/three/LogisticFlow3D' {
  const component: any
  export default component
}

declare namespace JSX {
  interface IntrinsicElements {
    'spline-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        url?: string;
        'loading-anim-type'?: string;
      },
      HTMLElement
    >;
  }
}


