package main

import "github.com/gofiber/fiber/v2"

type Message struct {
	Text string `json:"ip"`
}

func main() {
	app := fiber.New()

	app.Get("/", func(c *fiber.Ctx) error {
		ip := c.IP()
		println(ip)

		message := Message{
			Text: ip,
		}

		return c.JSON(message)
	})

	app.Listen(":3000")
}
