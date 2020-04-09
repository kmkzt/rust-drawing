// refference: https://github.com/rustwasm/wasm-bindgen/tree/master/examples/paint
use std::cell::Cell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

// https://github.com/bodoni/svg
use svg::Document;
use svg::node::element::path::Data;
use svg::node::element::Path;

// refference: https://rustwasm.github.io/wasm-bindgen/examples/console-log.html
#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

#[wasm_bindgen]
pub fn drawing_render(element_id: &str) -> Result<(), JsValue> {
    let document = web_sys::window().unwrap().document().unwrap();

    let target_element = document
        .get_element_by_id(element_id)
        .unwrap()
        .dyn_into::<web_sys::HtmlElement>()?;

    let data = Data::new()
        .move_to((10, 10))
        .line_by((0, 50))
        .line_by((50, 0))
        .line_by((0, -50))
        .close();

    let path = Path::new()
        .set("fill", "none")
        .set("stroke", "black")
        .set("stroke-width", 3)
        .set("d", data);

    let render_svg = Document::new()
        .set("viewBox", (0, 0, 70, 70))
        .add(path);

    // let canvas = document
    //     .get_element_by_id(element_id)
    //     .unwrap()
    //     .dyn_into::<web_sys::HtmlCanvasElement>()?;
    // canvas.set_width(640);
    // canvas.set_height(480);
    // canvas.style().set_property("border", "solid")?;
    // let context = canvas
    //     .get_context("2d")?
    //     .unwrap()
    //     .dyn_into::<web_sys::CanvasRenderingContext2d>()?;
    // let context = Rc::new(context);
        
    let pressed = Rc::new(Cell::new(false));
    {
        // let context = context.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            // context.begin_path();
            // context.move_to(event.offset_x() as f64, event.offset_y() as f64);
            log("mousedown");
            pressed.set(true);
            render_element.set_inner_html("mousedown");
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mousedown", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        // let context = context.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            log("mousemove");
            if pressed.get() {
                // context.line_to(event.offset_x() as f64, event.offset_y() as f64);
                // context.stroke();
                // context.begin_path();
                // context.move_to(event.offset_x() as f64, event.offset_y() as f64);
            }
            render_element.set_inner_html("mousemove");
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mousemove", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        // let context = context.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            pressed.set(false);
            // context.line_to(event.offset_x() as f64, event.offset_y() as f64);
            // context.stroke();
            log("mouseup");
            render_element.set_inner_html(&render_svg.to_string());
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mouseup", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }

    Ok(())
}
