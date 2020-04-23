// refference: https://github.com/rustwasm/wasm-bindgen/tree/master/examples/paint
use std::cell::{Cell, RefCell};
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

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


#[derive(Copy, Clone, Debug)]
struct Line {
    x: f32,
    y: f32
}
#[wasm_bindgen]
pub fn drawing_render(element_id: &str) -> Result<(), JsValue> {
    let document = web_sys::window().unwrap().document().unwrap();

    let target_element = document
        .get_element_by_id(element_id)
        .unwrap()
        .dyn_into::<web_sys::Element>()?;


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
    let line = Rc::new(RefCell::new(Vec::new()));
    {
        let pressed = pressed.clone();
        let line = line.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            // context.begin_path();
            // context.move_to(event.offset_x() as f64, event.offset_y() as f64);

            line.borrow_mut().push(Line {
                x: event.offset_x() as f32,
                y: event.offset_y() as f32
            });
            pressed.set(true);


            let test_log = format!("mousedown: x -> {}, y-> {}", event.offset_x() as f64, event.offset_y() as f64);
            render_element.set_inner_html(&test_log);
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mousedown", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        // let context = context.clone();
        let line = line.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            if pressed.get() {
                let test_log = format!("mousemove: x -> {}, y-> {}", event.offset_x() as f64, event.offset_y() as f64);
                render_element.set_inner_html(&test_log);

                line.borrow_mut().push(Line {
                    x: event.offset_x() as f32,
                    y: event.offset_y() as f32
                });
                // context.line_to(event.offset_x() as f64, event.offset_y() as f64);
                // context.stroke();
                // context.begin_path();
                // context.move_to(event.offset_x() as f64, event.offset_y() as f64);
            }
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mousemove", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        // let context = context.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();

        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            let mut path_d = "".to_string();
            for (i, li) in line.borrow().iter().enumerate() {
                match i {
                    0 => path_d.push_str(&format!("M{} {}", li.x, li.y)),
                    _ => path_d.push_str(&format!(" L {} {}", li.x, li.y)),
                }
            }
            pressed.set(false);
            // context.line_to(event.offset_x() as f64, event.offset_y() as f64);
            // context.stroke();
            log("mouseup");

            render_element.set_inner_html(&format!("<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"{}\" /></svg>", &path_d.to_string()));
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mouseup", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }

    Ok(())
}

