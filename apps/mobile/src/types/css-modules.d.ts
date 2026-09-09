// O template do Expo importa `.module.css` num componente `.web.tsx` mas nao
// declara o tipo. Sem isto o tsc quebra em algo que o Metro resolve bem.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
