// refference: https://github.com/rustwasm/wasm-bindgen/tree/master/examples/paint
use std::cell::{Cell, RefCell};
use std::rc::Rc;
use std::ops::{Deref, DerefMut};
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
struct Point {
    x: f32,
    y: f32
}

fn create_path(line: Vec<Point>) -> String {
    let mut path_d = "".to_string();
    for (i, li) in line.iter().enumerate() {
        match i {
            0 => path_d.push_str(&format!("M{} {}", li.x, li.y)),
            _ => path_d.push_str(&format!(" L {} {}", li.x, li.y)),
        }
    }

    path_d
}

#[test]
fn test_create_path() {
    assert_eq!(create_path(vec![Point { x: 0.0, y: 0.0 }, Point { x: 1.0, y: 1.0 }]), "M0 0 L 1 1");
}

// TODO: add fill, stroke, storke-width
#[derive(Clone, Debug)]
struct SvgPath {
    d: Vec<Point>
}
impl SvgPath {
    fn new() -> Self {
        SvgPath {
            d: Vec::new()
        }
    }

    fn add_point(&mut self, point: Point) {
        self.d.push(point);
    }

    fn to_string(&self) -> String {
        format!("<path stroke=\"black\" stroke-width=\"1\" fill=\"transparent\" d=\"{}\" />", create_path(self.d.to_vec()))
    }
}

#[derive(Clone, Debug)]
struct SvgDrawing {
    width: u32,
    height: u32,
    paths: Vec<SvgPath>
}

impl SvgDrawing {
    fn new(self) -> Self {
        SvgDrawing {
            ..self
        }
    }

    fn add_path(&mut self, path: &SvgPath) {
        self.paths.push(path.clone());
    }

    fn to_string(&self) -> String {
        let mut path_el = "".to_string();
        for p in self.paths.iter() {
            path_el.push_str(&p.to_string());
        }
        format!("<svg width=\"{}\" height=\"{}\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">{}</svg>",self.width, self.height, path_el)
    }
}

impl Default for SvgDrawing {
    fn default() -> Self {
        SvgDrawing {
            width: 640,
            height: 480,
            paths: Vec::new()
        }
    }
}
#[wasm_bindgen]
pub fn drawing_render(element_id: &str) -> Result<(), JsValue> {
    let document = web_sys::window().unwrap().document().unwrap();

    let target_element = document
        .get_element_by_id(element_id)
        .unwrap()
        .dyn_into::<web_sys::Element>()?;

    // TODO: to size automatically
    let el_width = 640;
    let el_height = 480;

    let pressed = Rc::new(Cell::new(false));
    let svg_path = Rc::new(RefCell::new(SvgPath::new()));
    let drawing = Rc::new(RefCell::new(SvgDrawing::default()));
    {
        let drawing = drawing.clone();
        let svg_path = svg_path.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            svg_path.borrow_mut().add_point(Point {
                x: event.offset_x() as f32,
                y: event.offset_y() as f32
            });
            pressed.set(true);

            log(&format!("mousedown: x -> {}, y-> {}", event.offset_x() as f64, event.offset_y() as f64));

            render_element.set_inner_html(&drawing.borrow().to_string());
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mousedown", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        let drawing = drawing.clone();
        let svg_path = svg_path.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            if pressed.get() {
                log(&format!("mousemove: x -> {}, y-> {}", event.offset_x() as f64, event.offset_y() as f64));

                svg_path.borrow_mut().add_point(Point {
                    x: event.offset_x() as f32,
                    y: event.offset_y() as f32
                });

                render_element.set_inner_html(&drawing.borrow().to_string());
            }
        }) as Box<dyn FnMut(_)>);
        target_element.add_event_listener_with_callback("mousemove", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        let drawing = drawing.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |_event: web_sys::MouseEvent| {
            pressed.set(false);
            log("mouseup");
            // let svg = svg_string(el_width, el_height, svg_path.borrow().to_string());
            drawing.borrow_mut().add_path(&svg_path.borrow());
            render_element.set_inner_html(&drawing.borrow().to_string());
        }) as Box<dyn FnMut(_)>);

        target_element.add_event_listener_with_callback("mouseup", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }

    Ok(())
}


