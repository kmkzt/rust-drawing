use std::ops::{Add, Sub};
use std::option::Option;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq)]
struct Point {
    x: f32,
    y: f32,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq)]
struct Vector {
    value: f32,
    angle: f32,
}

impl Vector {
    pub fn point(&self) -> Point {
        Point {
            x: self.angle.cos() * self.value,
            y: self.angle.sin() * self.value,
        }
    }

    pub fn scale(&self, s: f32) -> Self {
        Vector {
            angle: self.angle,
            value: self.value * s,
        }
    }
}

#[wasm_bindgen]
impl Point {
    pub fn new(x: f32, y: f32) -> Self {
        Point { x, y }
    }

    pub fn vector(&self, p: &Point) -> Vector {
        let v = p.sub(*self);
        Vector {
            value: (v.x.powf(2.0) + v.y.powf(2.0)).sqrt(),
            angle: v.y.atan2(v.x),
        }
    }

    pub fn scale(&self, r: f32) -> Self {
        Point {
            x: self.x * r,
            y: self.y * r,
        }
    }

    pub fn control(&self, v: &Vector) -> Self {
        v.point().add(*self)
    }

    pub fn command_move(&self) -> String {
        format!("M {} {}", self.x, self.y)
    }

    pub fn command_line(&self) -> String {
        format!(" L {} {}", self.x, self.y)
    }

    pub fn command_circuler(&self, cl: &Point, cr: &Point) -> String {
        format!(
            " C {} {} {} {} {} {}",
            cl.x, cl.y, cr.x, cr.y, self.x, self.y
        )
    }
}

impl Add for Point {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl Sub for Point {
    type Output = Point;

    fn sub(self, other: Point) -> Point {
        Point {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }
}

#[test]
fn test_vector() {
    // to point
    {
        // TODO: Fix to convert Point { x: 1.0, y: 1.0 }
        assert_eq!(
            Vector {
                value: 1.4142135,
                angle: 0.7853982
            }
            .point(),
            Point {
                x: 0.99999994,
                y: 0.99999994
            }
        );
    }
    // scale
    {
        assert_eq!(
            Vector {
                value: 1.0,
                angle: 0.5
            }
            .scale(0.3),
            Vector {
                value: 0.3,
                angle: 0.5
            }
        )
    }
}
#[test]
fn test_point() {
    // add sub
    {
        assert_eq!(
            Point::new(1.0, 1.0) + Point::new(2.0, 2.0),
            Point { x: 3.0, y: 3.0 }
        );
        assert_eq!(
            Point::new(3.0, 3.0) - Point::new(1.0, 1.0),
            Point { x: 2.0, y: 2.0 }
        );
    }

    // vector
    {
        assert_eq!(
            Point::new(0.0, 0.0).vector(&Point::new(1.0, 1.0)),
            Vector {
                value: 1.4142135,
                angle: 0.7853982
            }
        );
    }
    // control
    {
        let prev = Point { x: 1.0, y: 1.0 };
        let curr = Point { x: 2.0, y: 2.0 };
        let next = Point { x: 3.0, y: 1.0 };
        let vector = prev.vector(&next);
        assert_eq!(
            vector,
            Vector {
                value: 2.0,
                angle: 0.0
            }
        );
        assert_eq!(curr.control(&vector.scale(0.2)), Point { x: 2.4, y: 2.0 });
    }
    // scale
    {
        assert_eq!(
            Point { x: 1.0, y: 1.0 }.scale(0.2),
            Point { x: 0.2, y: 0.2 }
        )
    }

    // command
    {
        // move
        assert_eq!(Point { x: 1.0, y: 1.0 }.command_move(), "M 1 1");
        assert_eq!(Point { x: 1.1, y: 1.1 }.command_move(), "M 1.1 1.1");
        // line
        assert_eq!(Point { x: 1.0, y: 1.0 }.command_line(), " L 1 1");
        assert_eq!(Point { x: 1.1, y: 1.1 }.command_line(), " L 1.1 1.1");
        // Circuler
        assert_eq!(
            Point { x: 1.0, y: 1.0 }
                .command_circuler(&Point { x: 0.2, y: 1.2 }, &Point { x: 0.8, y: 1.2 }),
            " C 0.2 1.2 0.8 1.2 1 1"
        );
    }
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
fn create_path(line: Vec<Point>, close: bool, circul: bool) -> String {
    const SMOOTH_RATIO: f32 = 0.2;
    let mut path_d = "".to_string();
    fn complement_circuler(prev: &Point, start: &Point, end: &Point, next: &Point) -> String {
        let cl = start.control(&prev.vector(end).scale(SMOOTH_RATIO));
        let cr = end.control(&next.vector(start).scale(SMOOTH_RATIO));

        end.command_circuler(&cl, &cr)
    }
    for (i, po) in line.iter().enumerate() {
        // Start
        if i == 0 {
            path_d.push_str(&po.command_move());
            continue;
        }
        // Circuler
        if circul {
            // TODO: Fix frist circuler point
            if i < 2 {
                path_d.push_str(&po.command_line())
            // path_d.push_str(&circul_command(&line[0], &line[0], &po, &line[i + 1]));
            } else if i > line.len() - 2 {
                path_d.push_str(&complement_circuler(&line[i - 2], &line[i - 1], &po, &po));
            } else {
                path_d.push_str(&complement_circuler(
                    &line[i - 2],
                    &line[i - 1],
                    &po,
                    &line[i + 1],
                ));
            }
            continue;
        }

        // Polygon
        path_d.push_str(&po.command_line())
    }

    if close {
        path_d.push_str(" Z");
    }

    path_d
}

#[test]
fn test_create_path() {
    // Polygon
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
        "M 0 0 L 1 1 L -1 -1 Z"
    );

    // Circuler
    assert_eq!(
        create_path(
            vec![
                Point { x: 0.0, y: 0.0 },
                Point { x: 1.0, y: 1.0 },
                Point { x: 2.0, y: 1.0 },
                Point { x: 3.0, y: 0.0 }
            ],
            true,
            true
        ),
        // TODO: Fix
        // "M 0 0 L 1 1 C 1.4 1.2 1.6 1.2 2 1 C 2.4 0.8 2.8 0.2 3 0 Z"
        "M 0 0 L 1 1 C 1.4 1.2 1.5999999 1.1999999 2 1 C 2.4 0.8 2.8 0.2 3 0 Z"
    );
}

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq)]
struct SvgPath {
    close: bool,
    circul: bool,
    stroke_width: f32,
    stroke: String,
    fill: String,
    d: Vec<Point>,
}

#[wasm_bindgen]
impl SvgPath {
    pub fn new(close: Option<bool>, circul: Option<bool>) -> Self {
        SvgPath {
            close: match close {
                Some(clo) => clo,
                None => false,
            },
            circul: match circul {
                Some(cir) => cir,
                None => false,
            },
            stroke_width: 1.0,
            stroke: "black".to_string(),
            fill: "none".to_string(),
            d: Vec::new(),
        }
    }

    #[wasm_bindgen(js_name=isCircul)]
    pub fn is_circul(&self) -> bool {
        self.circul
    }

    #[wasm_bindgen(js_name=toggleCircul)]
    pub fn toggle_circul(&mut self) {
        self.circul = !self.circul
    }

    #[wasm_bindgen(js_name=isClose)]
    pub fn is_close(&self) -> bool {
        self.close
    }

    #[wasm_bindgen(js_name=toggleClose)]
    pub fn toggle_close(&mut self) {
        self.close = !self.close
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

    pub fn data(&self) -> String {
        create_path(self.d.to_vec(), self.close, self.circul)
    }

    pub fn to_string(&self) -> String {
        let mut path = "<path".to_string();

        // stroke
        path.push_str(&format!(" stroke=\"{}\"", &self.stroke));

        // stroke-width
        if self.stroke_width >= 0.0 {
            path.push_str(&format!(" stroke-width=\"{}\"", &self.stroke_width));
        }

        // fill
        path.push_str(&format!(" fill=\"{}\"", &self.fill));

        path.push_str(&format!(
            " d=\"{}\"",
            &self.data()
        ));

        path.push_str(" />");

        path
    }
}

#[test]
fn test_svgpath() {
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
        "M 0 0 L 1 1 L -1 -1 Z"
    );
}

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq)]
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
