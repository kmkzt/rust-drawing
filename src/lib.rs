// refference: https://github.com/rustwasm/wasm-bindgen/tree/master/examples/paint
use std::cell::{Cell, RefCell};
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

// https://github.com/bodoni/svg
use svg::Document;
use svg::node::element::path::Data;
use svg::node::element::Path;
use svg::node::element::SVG;

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
        .dyn_into::<web_sys::HtmlElement>()?;
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

        fn render_svg(x: f32, y: f32) -> String {
            let renderer = SvgRenderer::new();

           let data = Data::new()
                .move_to((10, 10))
                .line_by((0, 50))
                .line_by((x, y))
                .line_by((0, -50))
                .close();

            let path = Path::new()
                .set("fill", "none")
                .set("stroke", "black")
                .set("stroke-width", 3)
                .set("d", data);

            let render_svg = renderer
                .svg
                .set("viewBox", (0, 0, 70, 70))
                .add(path);

            render_svg.to_string()
        }


        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            for l in line.borrow().iter() {
                log(&format!("x: {}, y: {}", l.x, l.y));
            }
            pressed.set(false);
            // context.line_to(event.offset_x() as f64, event.offset_y() as f64);
            // context.stroke();
            log("mouseup");
            render_element.set_inner_html(&render_svg(event.offset_x() as f32, event.offset_y() as f32));
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mouseup", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }

    Ok(())
}


#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct SvgRenderer {
    svg: SVG,
    write: Data
}

#[wasm_bindgen]
impl SvgRenderer {
    pub fn new() -> Self {
        SvgRenderer {
            svg: Document::new(),
            write: Data::new()
        }
    }
    pub fn render(&self) -> String {
        self.svg.to_string()
    }
}

// impl SvgRenderer {
//     pub fn write(&self) -> &Data {
//         &self.write
//     }
//     pub fn svg(&self) -> &SVG {
//         &self.svg
//     }
// }
