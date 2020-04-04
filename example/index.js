// For more comments about what's going on here, check out the `hello_world`
// example.
import('./pkg')
  .then(mod => {
    console.log(mod)
    mod.drawing_render('app')
  })
  .catch(console.error)
