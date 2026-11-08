import { QuestionSet } from '../types';

export const DEFAULT_QUESTION_SETS: QuestionSet[] = [
  {
    id: 'bo-de-01',
    title: 'Bộ câu hỏi trắc nghiệm 01',
    questions: [
      {
        id: 1,
        title: 'Câu 1: Cặp đồ thị nào ở hình dưới đây là của chuyển động thẳng đều?',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlYAAAB/CAMAAAAaR3z6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJnUExURf////z8/P39/f7+/vv7+/n5+fr6+vj4+J6enpqamvf393d3d2hoaPLy8tPT0+zs7Onp6dDQ0Pb29uLi4mxsbPT09MTExNra2ktLS6ioqJWVlVZWVuvr642NjZycnPDw8O/v77a2tnJycoKCgnFxcW1tbX5+fk5OTsDAwPX19Xx8fPHx8eTk5GVlZY+Pj8jIyFFRUcPDwz8/P9zc3Nvb29TU1IyMjE1NTWdnZ2JiYmNjY0xMTPPz8+Dg4D09PZGRkU9PT1NTU8XFxTo6OkRERIGBgT4+PtnZ2VpaWmpqas7OzlVVVaGhoe3t7aKionBwcI6OjuXl5YuLi3l5eXt7ezk5OV5eXtbW1lxcXMLCwkFBQaurq2FhYaenp2ZmZoiIiDs7O97e3uHh4d/f31RUVKqqqnh4eDc3N7e3t9fX18rKyrGxsVlZWTw8PLW1tXZ2du7u7oSEhEJCQpiYmIODg2tra76+vldXV7S0tJ2dnWBgYN3d3V9fX5CQkOrq6nV1ddjY2EBAQKSkpFBQUDU1NUNDQ3R0dEVFRby8vDg4OKCgoNHR0bOzs7q6upmZmW5ubkdHR1hYWJSUlL+/v4eHh7KysuPj40pKSsfHx8zMzLi4uMvLy2RkZFtbW3Nzc4mJiX9/fzY2Nl1dXX19fW9vb8/Pz729vc3NzcbGxujo6NLS0ubm5p+fn8HBwbu7u6amplJSUqmpqZeXl6WlpUhISJKSkrm5uUlJSaOjo5ubm9XV1WlpaXp6eufn566urpaWlsnJyYqKirCwsICAgDQ0NJOTk6+vr0ZGRqysrK2trYaGhoWFhQAAAHO8CfMAAADNdFJOU///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////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',
        options: {
          A: '(I) và (III).',
          B: '(I) và (IV).',
          C: '(II) và (III).',
          D: '(II) và (IV).'
        },
        correct: 'B',
        duration: 30,
        explanation: '• Đồ thị (I): Đồ thị độ dịch chuyển – thời gian (d - t) là đường thẳng xiên góc đi qua gốc O biểu diễn chuyển động thẳng đều theo chiều dương.\n• Đồ thị (IV): Đồ thị vận tốc – thời gian (v - t) là đường thẳng nằm ngang song song trục thời gian biểu diễn vận tốc không đổi (v = const), tức là chuyển động thẳng đều.\n⇒ Cặp đồ thị của chuyển động thẳng đều là (I) và (IV).'
      },
      {
        id: 2,
        title: 'Câu 2: Đồ thị độ dịch chuyển – thời gian của một vật chuyển động như hình vẽ. Nhận xét nào sau đây là đúng?',
        image: 'data:image/png;base64,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',
        options: {
          A: 'Vật chuyển động ngược chiều dương với tốc độ 20 km/h.',
          B: 'Vật chuyển động cùng chiều dương với tốc độ 20 km/h.',
          C: 'Vật chuyển động ngược chiều dương với tốc độ 60 km/h.',
          D: 'Vật chuyển động cùng chiều dương với tốc độ 60 km/h.'
        },
        correct: 'A',
        duration: 30,
        explanation: 'Vận tốc của vật: v = (d₂ - d₁) / (t₂ - t₁) = (0 - 60) / (3 - 0) = -20 km/h.\n• v < 0: vật chuyển động ngược chiều dương.\n• Tốc độ: |v| = 20 km/h.'
      },
      {
        id: 3,
        title: 'Câu 3: Khi đồ thị độ dịch chuyển – thời gian có độ dốc lớn, điều này có nghĩa là gì về vận tốc của vật?',
        image: null,
        options: {
          A: 'Vận tốc của vật nhỏ.',
          B: 'Vận tốc của vật lớn.',
          C: 'Vật đang đứng yên.',
          D: 'Vật đang tăng tốc.'
        },
        correct: 'B',
        duration: 30,
        explanation: 'Trong đồ thị độ dịch chuyển – thời gian (d - t), hệ số góc (độ dốc) chính là vận tốc v = Δd / Δt. Độ dốc càng lớn thì vận tốc của vật càng lớn.'
      },
      {
        id: 4,
        title: 'Câu 4: Nếu một vật chuyển động thẳng đều và đổi chiều tại một điểm, đồ thị độ dịch chuyển – thời gian sẽ có đặc điểm gì tại điểm đó?',
        image: null,
        options: {
          A: 'Đồ thị sẽ có một điểm cực đại hoặc cực tiểu.',
          B: 'Đồ thị sẽ có một đoạn thẳng nằm ngang.',
          C: 'Đồ thị sẽ có một đoạn thẳng thẳng đứng.',
          D: 'Đồ thị sẽ có một điểm gấp khúc.'
        },
        correct: 'D',
        duration: 30,
        explanation: 'Khi đổi chiều chuyển động thẳng đều, độ dốc chuyển từ dương sang âm (hoặc ngược lại), tạo thành một điểm gấp khúc trên đồ thị.'
      },
      {
        id: 5,
        title: 'Câu 5: Để xác định vận tốc của vật từ đồ thị độ dịch chuyển – thời gian trong chuyển động thẳng đều, ta cần làm gì?',
        image: null,
        options: {
          A: 'Tính diện tích dưới đồ thị.',
          B: 'Tính độ dốc của đồ thị.',
          C: 'Tính khoảng cách giữa hai điểm trên đồ thị.',
          D: 'Tính giá trị lớn nhất của đồ thị.'
        },
        correct: 'B',
        duration: 30,
        explanation: 'Vận tốc của vật trong chuyển động thẳng đều có giá trị bằng độ dốc (hệ số góc) của đồ thị độ dịch chuyển – thời gian.'
      },
      {
        id: 6,
        title: 'Câu 6: Trong đồ thị độ dịch chuyển – thời gian, nếu độ dốc là một hằng số âm, điều này có nghĩa là gì?',
        image: null,
        options: {
          A: 'Vật đang tăng tốc theo chiều âm.',
          B: 'Vật đang chuyển động đều theo chiều âm.',
          C: 'Vật đang đứng yên.',
          D: 'Vật đang giảm tốc theo chiều âm.'
        },
        correct: 'B',
        duration: 30,
        explanation: '• Độ dốc là hằng số: chuyển động thẳng đều.\n• Độ dốc âm (v < 0): vật chuyển động theo chiều âm (ngược chiều dương đã chọn).'
      },
      {
        id: 7,
        title: 'Câu 7: Khi vật chuyển động thẳng đều theo chiều dương đã chọn, đồ thị độ dịch chuyển – thời gian có đặc điểm gì?',
        image: null,
        options: {
          A: 'Đường thẳng nằm ngang.',
          B: 'Đường cong parabol.',
          C: 'Đường thẳng xiên góc hướng lên.',
          D: 'Đường thẳng xiên góc hướng xuống.'
        },
        correct: 'C',
        duration: 30,
        explanation: 'Chuyển động thẳng đều theo chiều dương có v > 0 không đổi, nên đồ thị d - t là đường thẳng xiên góc hướng lên.'
      },
      {
        id: 8,
        title: 'Câu 8: Đồ thị độ dịch chuyển - thời gian trong chuyển động thẳng của một chiếc xe có dạng như hình vẽ. Trong khoảng thời gian nào xe chuyển động thẳng đều?',
        image: 'data:image/png;base64,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',
        options: {
          A: 'Chỉ trong khoảng thời gian từ 0 đến t1.',
          B: 'Chỉ trong khoảng thời gian từ t1 đến t2.',
          C: 'Trong khoảng thời gian từ 0 đến t2.',
          D: 'Không có lúc nào xe chuyển động thẳng đều.'
        },
        correct: 'A',
        duration: 30,
        explanation: '• Từ 0 đến t₁: Đồ thị d - t là đường thẳng xiên góc hướng lên ⇒ chuyển động thẳng đều theo chiều dương.\n• Từ t₁ đến t₂: Đồ thị nằm ngang song song trục thời gian ⇒ vật đứng yên.\n⇒ Xe chỉ chuyển động thẳng đều từ 0 đến t₁.'
      }
    ]
  },
  {
    id: 'bo-de-02',
    title: 'Bộ câu hỏi trắc nghiệm 02',
    questions: [
      {
        id: 1,
        title: 'Câu 1: Chuyển động biến đổi là chuyển động có đặc điểm nào sau đây?',
        options: {
          A: 'Chuyển động có vận tốc thay đổi theo thời gian.',
          B: 'Là những chuyển động luôn có vận tốc tăng đều.',
          C: 'Là những chuyển động luôn có vận tốc giảm đều.',
          D: 'Là những chuyển động có quỹ đạo tròn.'
        },
        correct: 'A',
        duration: 20,
        explanation: 'Chuyển động biến đổi là chuyển động có vận tốc thay đổi theo thời gian.'
      },
      {
        id: 2,
        title: 'Câu 2: Gia tốc là một đại lượng vật lí đặc trưng cho',
        options: {
          A: 'Sự nhanh hay chậm của chuyển động.',
          B: 'Sự biến thiên nhanh hay chậm của vận tốc theo thời gian.',
          C: 'Quãng đường vật đi được trong một đơn vị thời gian.',
          D: 'Sự thay đổi vị trí của vật trong không gian.'
        },
        correct: 'B',
        duration: 20,
        explanation: 'Gia tốc a = Δv / Δt là đại lượng vector đặc trưng cho sự biến thiên nhanh hay chậm của vận tốc.'
      },
      {
        id: 3,
        title: 'Câu 3: Đơn vị đo của gia tốc trong hệ đo lường chuẩn SI là',
        options: {
          A: 'm/s',
          B: 'km/h',
          C: 'm/s²',
          D: 'm.s'
        },
        correct: 'C',
        duration: 15,
        explanation: 'Trong hệ SI, đơn vị của gia tốc là mét trên giây bình phương (m/s²).'
      },
      {
        id: 4,
        title: 'Câu 4: Chuyển động thẳng nhanh dần đều có đặc điểm nào dưới đây?',
        options: {
          A: 'Vận tốc giảm đều theo thời gian.',
          B: 'Gia tốc ngược dấu với vận tốc (a.v < 0).',
          C: 'Gia tốc cùng dấu với vận tốc (a.v > 0).',
          D: 'Gia tốc luôn biến thiên liên tục.'
        },
        correct: 'C',
        duration: 20,
        explanation: 'Trong chuyển động thẳng nhanh dần đều, vector gia tốc cùng hướng với vector vận tốc, tức a.v > 0.'
      }
    ]
  }
];
