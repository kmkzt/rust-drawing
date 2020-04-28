// refference: https://github.com/rustwasm/wasm-bindgen/tree/master/examples/paint
use std::f32::consts::PI;
use wasm_bindgen::prelude::*;

// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
// #[wasm_bindgen]
// #[derive(Clone, Copy, Debug, PartialEq, Eq)]
// pub enum PointCommand {
//     Move,  // M x y
//     Line,  // L x y
//     Cubic, // C x1 y1, x2 y2, x y
//     // ShortCutCubic, // S x2 y2, x y
//     // Quadratic, // Q x1 y1, x y
//     // TogatherQuadratic, // T x y
//     Close, // Z x y
// }

#[wasm_bindgen]
#[derive(Copy, Clone, Debug)]
struct Point {
    x: f32,
    y: f32,
}

#[wasm_bindgen]
impl Point {
    pub fn new(x: f32, y: f32) -> Self {
        Point { x, y }
    }
}

struct Vector {
    value: f32,
    angle: f32,
}

fn create_vecor(prev: &Point, next: &Point) -> Vector {
    let vx = next.x - prev.x;
    let vy = next.y - prev.y;

    Vector {
        value: (vx.powf(2.0) + vy.powf(2.0)).sqrt(),
        angle: vy.atan2(vx),
    }
}

const SMOOTH_RATIO: f32 = 0.2;
fn create_control_point(prev: &Point, curr: &Point, next: &Point, reverse: bool) -> Point {
    let vector = create_vecor(prev, next);
    let smooth_value = vector.value * SMOOTH_RATIO;
    let angle = if reverse {
        vector.angle + PI
    } else {
        vector.angle
    };

    Point {
        x: curr.x + angle.cos() * smooth_value,
        y: curr.y + angle.sin() * smooth_value,
    }
}
fn create_path(line: Vec<Point>, close: bool, circul: bool) -> String {
    let mut path_d = "".to_string();
    for (i, po) in line.iter().enumerate() {
        // Start
        if i == 0 {
            path_d.push_str(&format!("M {} {}", po.x, po.y));
            continue;
        }
        // Check Close
        // TODO: Fix last point
        if i == line.len() - 1 && close {
            path_d.push_str(&format!(" L {} {} Z", po.x, po.y));
            continue;
        }
        // Circuler
        if circul {
            // TODO: Fix frist and last point
            if i < 2 || i + 2 > line.len() {
                path_d.push_str(&format!(" L {} {}", po.x, po.y))
            } else {
                let p1 = line[i - 1];
                let p2 = line[i - 2];
                let n = line[i + 1];
                let cl = create_control_point(&p2, &p1, &po, false);
                let cr = create_control_point(&p1, &po, &n, true);
                path_d.push_str(&format!(
                    " C {} {} {} {} {} {}",
                    cl.x, cl.y, cr.x, cr.y, po.x, po.y
                ));
            }
            continue;
        }

        // Polygon
        path_d.push_str(&format!(" L {} {}", po.x, po.y))
    }

    path_d
}

#[test]
fn test_create_path() {
    // Polygon Mode
    assert_eq!(
        create_path(
            vec![
                Point { x: 0.0, y: 0.0 },
                Point { x: 1.0, y: 1.0 },
                Point { x: -1.0, y: -1.0 }
            ],
            true,
            false
        ),
        "M 0 0 L 1 1 Z -1 -1"
    );
}

// TODO: add fill, stroke, storke-width
#[wasm_bindgen]
#[derive(Clone, Debug)]
struct SvgPath {
    close: bool,
    circul: bool,
    d: Vec<Point>,
}

#[wasm_bindgen]
impl SvgPath {
    pub fn new() -> Self {
        SvgPath {
            close: true,
            circul: true,
            d: Vec::new(),
        }
    }

    pub fn clear(&mut self) {
        self.d = Vec::new();
    }

    pub fn add(&mut self, point: Point) {
        self.d.push(point);
    }

    pub fn copy(&self) -> Self {
        self.clone()
    }

    pub fn to_string(&self) -> String {
        format!(
            "<path stroke=\"black\" stroke-width=\"1\" fill=\"transparent\" d=\"{}\" />",
            &create_path(self.d.to_vec(), self.close, self.circul)
        )
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
struct SvgDrawing {
    width: u32,
    height: u32,
    paths: Vec<SvgPath>,
}

#[wasm_bindgen]
impl SvgDrawing {
    pub fn new(width: u32, height: u32) -> Self {
        SvgDrawing {
            width,
            height,
            paths: Vec::new(),
        }
    }

    pub fn clear(&mut self) {
        self.paths = Vec::new();
    }

    pub fn add(&mut self, path: SvgPath) {
        self.paths.push(path);
    }

    pub fn update(&mut self, path: SvgPath) {
        self.paths.pop();
        self.paths.push(path);
    }

    pub fn to_string(&self) -> String {
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
            paths: Vec::new(),
        }
    }
}

// Rust EventHandle App
// use std::cell::{Cell, RefCell};
// use std::rc::Rc;
// use wasm_bindgen::JsCast;
// // refference: https://rustwasm.github.io/wasm-bindgen/examples/console-log.html
// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str);
// }
// #[wasm_bindgen(js_name=renderDraw)]
// pub fn render_draw_app(element_id: &str) -> Result<(), JsValue> {
//     let document = web_sys::window().unwrap().document().unwrap();
//     let target_element = document
//         .get_element_by_id(element_id)
//         .unwrap()
//         .dyn_into::<web_sys::Element>()?;
//     let pressed = Rc::new(Cell::new(false));
//     let svg_path = Rc::new(RefCell::new(SvgPath::new()));
//     // TODO: to size automatically
//     let drawing = Rc::new(RefCell::new(SvgDrawing::default()));
//     {
//         let drawing = drawing.clone();
//         let svg_path = svg_path.clone();
//         let pressed = pressed.clone();
//         let render_element = target_element.clone();
//         let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
//             svg_path.borrow_mut().add(Point {
//                 x: event.offset_x() as f32,
//                 y: event.offset_y() as f32,
//             });
//             pressed.set(true);
//             log(&format!(
//                 "mousedown: x -> {}, y-> {}",
//                 event.offset_x() as f64,
//                 event.offset_y() as f64
//             ));
//             render_element.set_inner_html(&drawing.borrow().to_string());
//         }) as Box<dyn FnMut(_)>);
//         target_element
//             .add_event_listener_with_callback("mousedown", closure.as_ref().unchecked_ref())?;
//         closure.forget();
//     }
//     {
//         let drawing = drawing.clone();
//         let svg_path = svg_path.clone();
//         let pressed = pressed.clone();
//         let render_element = target_element.clone();
//         let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
//             if pressed.get() {
//                 log(&format!(
//                     "mousemove: x -> {}, y-> {}",
//                     event.offset_x() as f64,
//                     event.offset_y() as f64
//                 ));
//                 svg_path.borrow_mut().add(Point {
//                     x: event.offset_x() as f32,
//                     y: event.offset_y() as f32,
//                 });
//                 render_element.set_inner_html(&drawing.borrow().to_string());
//             }
//         }) as Box<dyn FnMut(_)>);
//         target_element
//             .add_event_listener_with_callback("mousemove", closure.as_ref().unchecked_ref())?;
//         closure.forget();
//     }
//     {
//         let drawing = drawing.clone();
//         let pressed = pressed.clone();
//         let render_element = target_element.clone();
//         let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
//             pressed.set(false);
//             log("mouseup");
//             svg_path.borrow_mut().add(Point {
//                 x: event.offset_x() as f32,
//                 y: event.offset_y() as f32,
//             });
//             drawing.borrow_mut().add(svg_path.borrow().clone());
//             render_element.set_inner_html(&drawing.borrow().to_string());
//             svg_path.borrow_mut().clear();
//         }) as Box<dyn FnMut(_)>);
//         target_element
//             .add_event_listener_with_callback("mouseup", closure.as_ref().unchecked_ref())?;
//         closure.forget();
//     }
//     Ok(())
// }
