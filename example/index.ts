import('../pkg')
  .then((mod: any) => {
    console.log(mod)
    mod.drawing_render('app')
  })
  .catch(console.error)
