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

// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
#[derive(Copy, Clone, Debug)]
enum PointCommand {
    Move,  // M x y
    Line,  // L x y
    Cubic, // C x1 y1, x2 y2, x y
    // ShortCutCubic, // S x2 y2, x y
    // Quadratic, // Q x1 y1, x y
    // TogatherQuadratic, // T x y
    Close, // Z x y
}

#[derive(Copy, Clone, Debug)]
struct Point {
    command: PointCommand,
    x: f32,
    y: f32,
}

struct Vector {
    value: f32,
    angle: f32,
}

fn create_vecor(prev: (f32, f32), next: (f32, f32)) -> Vector {
    let vx = next.0 - prev.0;
    let vy = next.1 - prev.1;

    return Vector {
        value: (vx.powf(2.0) + vy.powf(2.0)).sqrt(),
        angle: vy.atan2(vx),
    };
}
const SMOOTH_RATIO: f32 = 0.2;
fn create_control_point(prev: (f32, f32), curr: (f32, f32), next: (f32, f32)) -> (f32, f32) {
    let vector = create_vecor(prev, next);
    let smooth_value = vector.value * SMOOTH_RATIO;

    (
        curr.0 + vector.angle.cos() * smooth_value,
        curr.1 + vector.angle.sin() * smooth_value,
    )
}
fn create_path(line: Vec<Point>) -> String {
    let mut path_d = "".to_string();
    for (i, po) in line.iter().enumerate() {
        if i != 0 {
            path_d.push_str(&format!(" "));
        }

        match po.command {
            PointCommand::Move => path_d.push_str(&format!("M {} {}", po.x, po.y)),
            PointCommand::Cubic => {
                if i < 2 || i + 1 > line.len() {
                    path_d.push_str(&format!("L {} {}", po.x, po.y))
                } else {
                    let p1 = line[i - 1];
                    let p2 = line[i - 2];
                    let n = line[i + 1];
                    let cl = create_control_point((p2.x, p2.y), (p1.x, p1.y), (po.x, po.y));
                    let cr = create_control_point((p1.x, p1.y), (po.x, po.y), (n.x, n.y));
                    path_d.push_str(&format!(
                        "C {} {} {} {} {} {}",
                        cl.0, cl.1, cr.0, cr.1, po.x, po.y
                    ));
                }
            }
            PointCommand::Close => path_d.push_str(&format!("Z {} {}", po.x, po.y)),
            _ => path_d.push_str(&format!("L {} {}", po.x, po.y)),
        }
    }

    path_d
}

#[test]
fn test_create_path() {
    assert_eq!(
        create_path(vec![
            Point {
                command: PointCommand::Move,
                x: 0.0,
                y: 0.0
            },
            Point {
                command: PointCommand::Line,
                x: 1.0,
                y: 1.0
            },
            Point {
                command: PointCommand::Close,
                x: -1.0,
                y: -1.0
            }
        ]),
        "M 0 0 L 1 1 Z -1 -1"
    );
}

// TODO: add fill, stroke, storke-width
#[derive(Clone, Debug)]
struct SvgPath {
    d: Vec<Point>,
}
impl SvgPath {
    fn new() -> Self {
        SvgPath { d: Vec::new() }
    }

    fn clear(&mut self) {
        self.d = Vec::new();
    }

    fn add_point(&mut self, point: Point) {
        self.d.push(point);
    }

    fn to_string(&self) -> String {
        format!(
            "<path stroke=\"black\" stroke-width=\"1\" fill=\"transparent\" d=\"{}\" />",
            create_path(self.d.to_vec())
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

impl SvgDrawing {
    fn new(self) -> Self {
        SvgDrawing { ..self }
    }

    fn add_path(&mut self, path: SvgPath) {
        self.paths.push(path);
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
            paths: Vec::new(),
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

    let pressed = Rc::new(Cell::new(false));
    let svg_path = Rc::new(RefCell::new(SvgPath::new()));
    // TODO: to size automatically
    let drawing = Rc::new(RefCell::new(SvgDrawing::default()));
    {
        let drawing = drawing.clone();
        let svg_path = svg_path.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            svg_path.borrow_mut().add_point(Point {
                command: PointCommand::Move,
                x: event.offset_x() as f32,
                y: event.offset_y() as f32,
            });
            pressed.set(true);

            log(&format!(
                "mousedown: x -> {}, y-> {}",
                event.offset_x() as f64,
                event.offset_y() as f64
            ));

            render_element.set_inner_html(&drawing.borrow().to_string());
        }) as Box<dyn FnMut(_)>);
        target_element
            .add_event_listener_with_callback("mousedown", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        let drawing = drawing.clone();
        let svg_path = svg_path.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            if pressed.get() {
                log(&format!(
                    "mousemove: x -> {}, y-> {}",
                    event.offset_x() as f64,
                    event.offset_y() as f64
                ));

                svg_path.borrow_mut().add_point(Point {
                    command: PointCommand::Cubic,
                    x: event.offset_x() as f32,
                    y: event.offset_y() as f32,
                });

                render_element.set_inner_html(&drawing.borrow().to_string());
            }
        }) as Box<dyn FnMut(_)>);
        target_element
            .add_event_listener_with_callback("mousemove", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }
    {
        let drawing = drawing.clone();
        let pressed = pressed.clone();
        let render_element = target_element.clone();
        let closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
            pressed.set(false);
            log("mouseup");
            svg_path.borrow_mut().add_point(Point {
                command: PointCommand::Line,
                x: event.offset_x() as f32,
                y: event.offset_y() as f32,
            });
            drawing.borrow_mut().add_path(svg_path.borrow().clone());
            render_element.set_inner_html(&drawing.borrow().to_string());
            svg_path.borrow_mut().clear();
        }) as Box<dyn FnMut(_)>);

        target_element
            .add_event_listener_with_callback("mouseup", closure.as_ref().unchecked_ref())?;
        closure.forget();
    }

    Ok(())
}
